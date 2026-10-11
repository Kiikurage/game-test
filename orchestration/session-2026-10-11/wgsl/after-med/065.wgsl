// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 0 ) @group( 1 ) var nodeUniform0_sampler : sampler;
@binding( 1 ) @group( 1 ) var nodeUniform0 : texture_2d<f32>;
@binding( 4 ) @group( 1 ) var nodeUniform9_sampler : sampler;
@binding( 5 ) @group( 1 ) var nodeUniform9 : texture_2d<f32>;
@binding( 6 ) @group( 1 ) var nodeUniform22_sampler : sampler_comparison;
@binding( 7 ) @group( 1 ) var nodeUniform22 : texture_depth_2d;

struct NodeBuffer_10001Struct {
	value : array< vec4<f32>, 7 >
};
@binding( 3 ) @group( 1 )
var<uniform> NodeBuffer_10001 : NodeBuffer_10001Struct;

struct objectStruct {
	nodeUniform1 : f32,
	nodeUniform2 : f32,
	nodeUniform4 : mat3x3<f32>,
	nodeUniform6 : mat4x4<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform31 : vec3<f32>,
	nodeUniform33 : vec3<f32>,
	nodeUniform34 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	nodeUniform8 : f32,
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform11 : vec3<f32>,
	nodeUniform12 : vec3<f32>,
	nodeUniform10 : vec3<f32>,
	nodeUniform15 : vec3<f32>,
	nodeUniform18 : vec3<f32>,
	nodeUniform27 : vec3<f32>,
	nodeUniform28 : f32,
	nodeUniform29 : f32,
	nodeUniform13 : vec3<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform26 : vec3<f32>,
	nodeUniform19 : mat4x4<f32>,
	nodeUniform20 : f32,
	nodeUniform21 : f32,
	nodeUniform25 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform23 : f32,
	nodeUniform24 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : f32;
var<private> nodeVar1 : u32;
var<private> nodeVar2 : u32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : u32;
var<private> nodeVar8 : u32;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : u32;
var<private> nodeVar12 : u32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : u32;
var<private> nodeVar17 : u32;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : u32;
var<private> nodeVar20 : u32;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : vec3<f32>;
var<private> nodeVar23 : f32;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : vec2<f32>;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : vec3<f32>;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : vec2<f32>;
var<private> nodeVar32 : vec3<f32>;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : f32;
var<private> nodeVar35 : vec2<f32>;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : f32;
var<private> nodeVar40 : vec3<f32>;
var<private> nodeVar41 : f32;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : vec2<f32>;
var<private> nodeVar44 : f32;
var<private> nodeVar45 : f32;
var<private> nodeVar46 : f32;
var<private> nodeVar47 : f32;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : f32;
var<private> nodeVar51 : f32;
var<private> nodeVar52 : vec2<f32>;
var<private> nodeVar53 : vec3<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar54 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar55 : vec3<f32>;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : vec3<f32>;
var<private> nodeVar58 : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> NORMAL_nodeVar59 : vec3<f32>;
var<private> NORMAL_nodeVar60 : f32;
var<private> nodeVar61 : f32;
var<private> nodeVar62 : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar63 : vec3<f32>;
var<private> nodeVar64 : f32;
var<private> nodeVar65 : vec3<f32>;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : f32;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : f32;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : f32;
var<private> nodeVar73 : vec3<f32>;
var<private> nodeVar74 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar75 : f32;
var<private> nodeVar76 : vec2<f32>;
var<private> nodeVar77 : f32;
var<private> nodeVar78 : f32;
var<private> nodeVar79 : f32;
var<private> nodeVar80 : f32;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar83 : f32;
var<private> nodeVar84 : f32;
var<private> nodeVar85 : f32;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : vec4<f32>;
var<private> nodeVar90 : vec4<f32>;
var<private> nodeVar91 : vec3<f32>;
var<private> nodeVar92 : vec3<f32>;
var<private> nodeVar93 : f32;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : vec3<f32>;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : f32;
var<private> nodeVar101 : f32;
var<private> nodeVar102 : f32;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : f32;
var<private> nodeVar110 : f32;
var<private> nodeVar111 : f32;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec4<f32>;
var<private> nodeVar118 : vec4<f32>;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : vec3<f32>;
var<private> nodeVar121 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar122 : f32;
var<private> nodeVar123 : vec4<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : f32;
var<private> nodeVar127 : f32;
var<private> nodeVar128 : vec2<f32>;
var<private> nodeVar129 : f32;
var<private> nodeVar130 : vec2<f32>;
var<private> nodeVar131 : f32;
var<private> nodeVar132 : vec2<f32>;
var<private> nodeVar133 : f32;
var<private> nodeVar134 : vec2<f32>;
var<private> nodeVar135 : f32;
var<private> nodeVar136 : vec2<f32>;
var<private> nodeVar137 : f32;
var<private> nodeVar138 : f32;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : f32;
var<private> nodeVar146 : f32;
var<private> nodeVar147 : f32;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : f32;
var<private> nodeVar155 : f32;
var<private> nodeVar156 : f32;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : f32;
var<private> nodeVar164 : f32;
var<private> nodeVar165 : f32;
var<private> nodeVar166 : f32;
var<private> nodeVar167 : f32;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : f32;
var<private> nodeVar176 : f32;
var<private> nodeVar177 : f32;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : f32;
var<private> nodeVar185 : f32;
var<private> nodeVar186 : f32;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : f32;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : f32;
var<private> nodeVar203 : f32;
var<private> nodeVar204 : f32;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : f32;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : f32;
var<private> nodeVar229 : f32;
var<private> nodeVar230 : f32;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> nodeVar233 : vec3<f32>;
var<private> nodeVar234 : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> nodeVar236 : vec3<f32>;
var<private> nodeVar237 : vec3<f32>;
var<private> nodeVar238 : f32;
var<private> nodeVar239 : vec3<f32>;
var<private> nodeVar240 : vec3<f32>;
var<private> nodeVar241 : vec3<f32>;
var<private> nodeVar242 : vec3<f32>;
var<private> nodeVar243 : vec3<f32>;
var<private> nodeVar244 : vec3<f32>;
var<private> nodeVar245 : vec3<f32>;
var<private> nodeVar246 : f32;
var<private> nodeVar247 : f32;
var<private> nodeVar248 : f32;
var<private> nodeVar249 : vec3<f32>;
var<private> nodeVar250 : vec3<f32>;
var<private> nodeVar251 : vec3<f32>;
var<private> nodeVar252 : vec3<f32>;
var<private> nodeVar253 : vec3<f32>;
var<private> nodeVar254 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar255 : vec3<f32>;
var<private> nodeVar256 : vec3<f32>;
var<private> nodeVar257 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar258 : vec3<f32>;
var<private> nodeVar259 : vec3<f32>;
var<private> nodeVar260 : vec3<f32>;
var<private> nodeVar261 : vec3<f32>;
var<private> nodeVar262 : vec3<f32>;
var<private> nodeVar263 : vec3<f32>;
var<private> nodeVar264 : vec3<f32>;
var<private> nodeVar265 : vec3<f32>;
var<private> nodeVar266 : vec3<f32>;
var<private> nodeVar267 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar268 : vec3<f32>;
var<private> nodeVar269 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar270 : vec3<f32>;
var<private> nodeVar271 : f32;
var<private> nodeVar272 : f32;
var<private> nodeVar273 : f32;
var<private> nodeVar274 : f32;
var<private> nodeVar275 : f32;
var<private> nodeVar276 : f32;
var<private> nodeVar277 : f32;
var<private> nodeVar278 : f32;
var<private> nodeVar279 : f32;
var<private> nodeVar280 : f32;
var<private> nodeVar281 : f32;
var<private> nodeVar282 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar283 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar284 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar285 : vec3<f32>;
var<private> nodeVar286 : f32;
var<private> nodeVar287 : vec4<f32>;

// codes
fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }
fn V_GGX_SmithCorrelated ( alpha : f32, dotNL : f32, dotNV : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = ( alpha * alpha );

	return ( 0.5 / max( ( ( dotNL * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNV * dotNV ) ) ) ) ) + ( dotNV * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNL * dotNL ) ) ) ) ) ), 0.000001 ) );

}


fn D_GGX ( alpha : f32, dotNH : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;

	nodeVar0 = ( alpha * alpha );
	nodeVar1 = ( 1.0 - ( ( dotNH * dotNH ) * ( 1.0 - nodeVar0 ) ) );

	return ( ( nodeVar0 / ( nodeVar1 * nodeVar1 ) ) * 0.3183098861837907 );

}


fn interleavedGradientNoise ( position : vec2<f32> ) -> f32 {

	


	return fract( ( 52.9829189 * fract( dot( position, vec2<f32>( 0.06711056, 0.00583715 ) ) ) ) );

}


fn vogelDiskSample ( sampleIndex : i32, samplesCount : i32, phi : f32 ) -> vec2<f32> {

	var nodeVar0 : f32;

	nodeVar0 = ( ( f32( sampleIndex ) * 2.399963229728653 ) + phi );

	return ( vec2<f32>( cos( nodeVar0 ), sin( nodeVar0 ) ) * vec2<f32>( sqrt( ( ( f32( sampleIndex ) + 0.5 ) / f32( samplesCount ) ) ) ) );

}




@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_normalViewGeometry : vec3<f32>,
	@location( 2 ) v_positionWorld : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@location( 4 ) nodeVarying7 : vec3<f32>,
	@location( 5 ) nodeVarying8 : vec2<f32>,
	@location( 6 ) nodeVarying9 : vec2<f32>,
	@location( 7 ) nodeVarying10 : vec3<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = floor( ( nodeVarying8.y / 0.72 ) );
	nodeVar1 = ( ( u32( ( nodeVar0 + 2.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar2 = ( ( ( nodeVar1 >> ( ( nodeVar1 >> 28u ) + 4u ) ) ^ nodeVar1 ) * 277803737u );
	nodeVar3 = ( ( ( f32( ( ( nodeVar2 >> 22u ) ^ nodeVar2 ) ) * 2.3283064365386963e-10 ) * 0.2 ) + 0.28 );
	nodeVar4 = ( nodeVarying8.y - ( nodeVar0 * 0.72 ) );
	nodeVar5 = step( nodeVar3, nodeVar4 );
	nodeVar6 = ( ( nodeVar0 * 2.0 ) + nodeVar5 );
	nodeVar7 = ( ( u32( ( nodeVar6 + 11.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar8 = ( ( ( nodeVar7 >> ( ( nodeVar7 >> 28u ) + 4u ) ) ^ nodeVar7 ) * 277803737u );
	nodeVar9 = step( 0.5, nodeVarying9.y );
	nodeVar10 = mix( ( ( ( f32( ( ( nodeVar8 >> 22u ) ^ nodeVar8 ) ) * 2.3283064365386963e-10 ) * 0.75 ) + 0.62 ), nodeVarying9.x, nodeVar9 );
	nodeVar11 = ( ( u32( ( nodeVar6 + 5.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar12 = ( ( ( nodeVar11 >> ( ( nodeVar11 >> 28u ) + 4u ) ) ^ nodeVar11 ) * 277803737u );
	nodeVar13 = ( ( nodeVarying8.x / nodeVar10 ) + ( ( tsl_mod_float( nodeVar6, 2.0 ) * 0.5 ) + floor( ( ( f32( ( ( nodeVar12 >> 22u ) ^ nodeVar12 ) ) * 2.3283064365386963e-10 ) * 8.0 ) ) ) );
	nodeVar14 = floor( nodeVar13 );
	nodeVar15 = ( mix( nodeVar14, tsl_mod_float( nodeVar14, max( nodeVarying9.y, 1.0 ) ), nodeVar9 ) + ( nodeVar6 * 57.3 ) );
	nodeVar16 = ( ( u32( ( nodeVar15 + 19.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar17 = ( ( ( nodeVar16 >> ( ( nodeVar16 >> 28u ) + 4u ) ) ^ nodeVar16 ) * 277803737u );
	nodeVar18 = ( ( f32( ( ( nodeVar17 >> 22u ) ^ nodeVar17 ) ) * 2.3283064365386963e-10 ) - 0.5 );
	nodeVar19 = ( ( u32( nodeVar15 ) * 747796405u ) + 2891336453u );
	nodeVar20 = ( ( ( nodeVar19 >> ( ( nodeVar19 >> 28u ) + 4u ) ) ^ nodeVar19 ) * 277803737u );
	nodeVar21 = ( ( ( f32( ( ( nodeVar20 >> 22u ) ^ nodeVar20 ) ) * 2.3283064365386963e-10 ) * 0.62 ) + 0.66 );
	nodeVar22 = fract( ( vec3<f32>( ( nodeVarying8.x * 6.3 ), ( nodeVarying8.y * 6.3 ), ( nodeVar15 * 0.37 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar23 = ( nodeVar22.z * 64.0 );
	nodeVar24 = floor( nodeVar23 );
	nodeVar25 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar24, 8.0 ), floor( ( nodeVar24 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar22.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar26 = mix( nodeVar25.x, nodeVar25.y, ( nodeVar23 - nodeVar24 ) );
	nodeVar27 = smoothstep( 0.4, 0.7, 0.0 );
	nodeVar28 = fract( ( vec3<f32>( ( nodeVarying8.x * 0.85 ), ( nodeVarying8.y * 0.16 ), 3.3 ) / vec3<f32>( 8.0 ) ) );
	nodeVar29 = ( nodeVar28.z * 64.0 );
	nodeVar30 = floor( nodeVar29 );
	nodeVar31 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar30, 8.0 ), floor( ( nodeVar30 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar28.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar32 = fract( ( vec3<f32>( ( nodeVarying8.x * 0.5 ), ( nodeVarying8.y * 0.45 ), 8.2 ) / vec3<f32>( 8.0 ) ) );
	nodeVar33 = ( nodeVar32.z * 64.0 );
	nodeVar34 = floor( nodeVar33 );
	nodeVar35 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar34, 8.0 ), floor( ( nodeVar34 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar32.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar36 = mix( nodeVar35.x, nodeVar35.y, ( nodeVar33 - nodeVar34 ) );
	nodeVar37 = fract( nodeVar13 );
	nodeVar38 = mix( nodeVar3, ( 0.72 - nodeVar3 ), nodeVar5 );
	nodeVar39 = ( ( nodeVar4 - ( nodeVar5 * nodeVar3 ) ) / nodeVar38 );
	nodeVar40 = fract( ( vec3<f32>( ( nodeVarying8.x * 7.1 ), ( nodeVarying8.y * 7.1 ), 1.7 ) / vec3<f32>( 8.0 ) ) );
	nodeVar41 = ( nodeVar40.z * 64.0 );
	nodeVar42 = floor( nodeVar41 );
	nodeVar43 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar42, 8.0 ), floor( ( nodeVar42 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar40.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar44 = ( min( ( min( nodeVar37, ( 1.0 - nodeVar37 ) ) * nodeVar10 ), ( min( nodeVar39, ( 1.0 - nodeVar39 ) ) * nodeVar38 ) ) + ( mix( nodeVar43.x, nodeVar43.y, ( nodeVar41 - nodeVar42 ) ) * 0.011 ) );
	nodeVar45 = max( fwidth( nodeVarying8.x ), fwidth( nodeVarying8.y ) );
	nodeVar46 = ( ( nodeVar45 * 0.75 ) + 0.0015 );
	nodeVar47 = mix( ( 1.0 - smoothstep( ( 0.024 - nodeVar46 ), ( 0.024 + nodeVar46 ), nodeVar44 ) ), 0.17, smoothstep( 0.1, 0.34, nodeVar45 ) );
	nodeVar48 = smoothstep( 1.7, 0.0, ( ( nodeVarying10.z + ( nodeVar26 * 0.35 ) ) + ( nodeVar36 * 0.4 ) ) );
	nodeVar49 = fract( ( vec3<f32>( ( nodeVarying8.x * 2.4 ), ( nodeVarying8.y * 2.4 ), 9.1 ) / vec3<f32>( 8.0 ) ) );
	nodeVar50 = ( nodeVar49.z * 64.0 );
	nodeVar51 = floor( nodeVar50 );
	nodeVar52 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar51, 8.0 ), floor( ( nodeVar51 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar49.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar53 = mix( ( ( nodeVarying7 * vec3<f32>( ( 1.0 + ( nodeVar18 * 0.12 ) ), ( 1.0 - ( nodeVar18 * 0.02 ) ), ( 1.0 - ( nodeVar18 * 0.14 ) ) ) ) * vec3<f32>( max( ( ( ( ( ( ( ( ( ( ( nodeVar21 + ( nodeVar26 * 0.11 ) ) + 0.0 ) + ( nodeVar27 * 0.07 ) ) + ( mix( nodeVar31.x, nodeVar31.y, ( nodeVar29 - nodeVar30 ) ) * 0.1 ) ) + ( nodeVar36 * 0.12 ) ) + ( smoothstep( 0.32, 0.0, ( min( nodeVarying10.x, nodeVarying10.y ) + ( nodeVar26 * 0.08 ) ) ) * 0.16 ) ) + ( ( smoothstep( 0.08, 0.035, nodeVar44 ) * ( 1.0 - nodeVar47 ) ) * 0.1 ) ) * ( ( smoothstep( 0.0, 0.2, nodeVar44 ) * 0.16 ) + 0.84 ) ) * ( 1.0 - ( nodeVar48 * 0.4 ) ) ) * ( 1.0 - ( nodeVar47 * 0.65 ) ) ), 0.0 ) ) ), ( vec3<f32>( 0.07, 0.09, 0.03 ) * vec3<f32>( nodeVar21 ) ), ( ( ( ( nodeVar48 * smoothstep( 0.0, 0.55, ( mix( nodeVar52.x, nodeVar52.y, ( nodeVar50 - nodeVar51 ) ) + 0.15 ) ) ) * smoothstep( 1.1, 0.0, nodeVarying10.z ) ) * ( 1.0 - nodeVar47 ) ) * 0.6 ) );
	DiffuseColor = vec4<f32>( nodeVar53, 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform1 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform2;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar54 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( mix( 0.93, 0.5, ( nodeVar48 * 0.75 ) ), 0.0525 ) + max( max( nodeVar54.x, nodeVar54.y ), nodeVar54.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform2 ) ) );
	nodeVar55 = ( NodeBuffer_10001.value[ 0u ].xyz - v_positionWorld );
	nodeVar56 = dot( nodeVar55, nodeVar55 );
	nodeVar57 = dpdx( v_positionView );
	nodeVar58 = - dpdy( v_positionView );
	NORMAL_normalView = normalViewGeometry;
	NORMAL_nodeVar59 = cross( nodeVar58, NORMAL_normalView );
	NORMAL_nodeVar60 = dot( nodeVar57, NORMAL_nodeVar59 );
	nodeVar61 = ( ( ( ( ( smoothstep( 0.0, 0.07, nodeVar44 ) * 0.014 ) + ( smoothstep( 0.0, 0.02, nodeVar44 ) * 0.006 ) ) + 0.0 ) + ( nodeVar27 * -0.004 ) ) * ( 1.0 - smoothstep( 0.05, 0.22, nodeVar45 ) ) );
	nodeVar62 = ( vec3<f32>( sign( NORMAL_nodeVar60 ) ) * ( ( vec3<f32>( dpdx( nodeVar61 ) ) * NORMAL_nodeVar59 ) + ( vec3<f32>( - dpdy( nodeVar61 ) ) * cross( NORMAL_normalView, nodeVar57 ) ) ) );
	normalView = normalize( ( ( vec3<f32>( abs( NORMAL_nodeVar60 ) ) * NORMAL_normalView ) - nodeVar62 ) );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar63 = ( NodeBuffer_10001.value[ 1u ].xyz - v_positionWorld );
	nodeVar64 = dot( nodeVar63, nodeVar63 );
	nodeVar65 = ( NodeBuffer_10001.value[ 2u ].xyz - v_positionWorld );
	nodeVar66 = dot( nodeVar65, nodeVar65 );
	nodeVar67 = ( NodeBuffer_10001.value[ 3u ].xyz - v_positionWorld );
	nodeVar68 = dot( nodeVar67, nodeVar67 );
	nodeVar69 = ( NodeBuffer_10001.value[ 4u ].xyz - v_positionWorld );
	nodeVar70 = dot( nodeVar69, nodeVar69 );
	nodeVar71 = ( NodeBuffer_10001.value[ 5u ].xyz - v_positionWorld );
	nodeVar72 = dot( nodeVar71, nodeVar71 );
	nodeVar73 = ( NodeBuffer_10001.value[ 6u ].xyz - v_positionWorld );
	nodeVar74 = dot( nodeVar73, nodeVar73 );
	EmissiveColor = ( nodeVar53 * ( ( ( ( ( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_10001.value[ 0u ].w * ( 1.0 / ( 1.0 + ( nodeVar56 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar55 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar56 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 0.0 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 0.0 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_10001.value[ 1u ].w * ( 1.0 / ( 1.0 + ( nodeVar64 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar63 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar64 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 2.13 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 2.13 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_10001.value[ 2u ].w * ( 1.0 / ( 1.0 + ( nodeVar66 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar65 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar66 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 4.26 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 4.26 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_10001.value[ 3u ].w * ( 1.0 / ( 1.0 + ( nodeVar68 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar67 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar68 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 6.39 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 6.39 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_10001.value[ 4u ].w * ( 1.0 / ( 1.0 + ( nodeVar70 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar69 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar70 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 8.52 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 8.52 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_10001.value[ 5u ].w * ( 1.0 / ( 1.0 + ( nodeVar72 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar71 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar72 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 10.649999999999999 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 10.649999999999999 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_10001.value[ 6u ].w * ( 1.0 / ( 1.0 + ( nodeVar74 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar73 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar74 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 12.78 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 12.78 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar75 = dot( normalView, positionViewDirection );
	nodeVar76 = textureSample( nodeUniform9, nodeUniform9_sampler, vec2<f32>( Roughness, clamp( nodeVar75, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar76;
	nodeVar77 = ( dfg.x + dfg.y );
	nodeVar78 = ( 1.0 / nodeVar77 );
	nodeVar79 = nodeVar78;
	nodeVar80 = ( nodeVar79 - 1.0 );
	nodeVar81 = ( SpecularColorBlended * vec3<f32>( nodeVar80 ) );
	nodeVar82 = ( nodeVar81 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar82;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar83 = dot( normalWorld, normalize( render.nodeUniform12 ) );
	nodeVar84 = ( nodeVar83 * 0.5 );
	nodeVar85 = ( nodeVar84 + 0.5 );
	nodeVar86 = mix( render.nodeUniform10, render.nodeUniform11, nodeVar85 );
	nodeVar87 = ( irradiance + nodeVar86 );
	irradiance = nodeVar87;
	nodeVar88 = ( render.nodeUniform13 - render.nodeUniform14 );
	nodeVar89 = vec4<f32>( nodeVar88, 0.0 );
	nodeVar90 = ( render.cameraViewMatrix * nodeVar89 );
	nodeVar91 = normalize( nodeVar90.xyz );
	nodeVar92 = nodeVar91;
	nodeVar93 = dot( normalView, nodeVar92 );
	nodeVar94 = ( vec3<f32>( clamp( nodeVar93, 0.0, 1.0 ) ) * render.nodeUniform15 );
	nodeVar95 = nodeVar94;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar96 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar97 = ( nodeVar95 * nodeVar96 );
	nodeVar98 = ( nodeVar92 + positionViewDirection );
	nodeVar99 = normalize( nodeVar98 );
	nodeVar100 = dot( positionViewDirection, nodeVar99 );
	nodeVar101 = clamp( nodeVar100, 0.0, 1.0 );
	nodeVar102 = exp2( ( ( ( nodeVar101 * -5.55473 ) - 6.98316 ) * nodeVar101 ) );
	nodeVar103 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar102 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar102 ) ) );
	nodeVar104 = ( vec3<f32>( 1.0 ) - nodeVar103 );
	nodeVar105 = nodeVar104;
	nodeVar106 = ( nodeVar97 * nodeVar105 );
	nodeVar107 = ( directDiffuse + nodeVar106 );
	directDiffuse = nodeVar107;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar108 = normalize( ( nodeVar92 + positionViewDirection ) );
	nodeVar109 = clamp( dot( positionViewDirection, nodeVar108 ), 0.0, 1.0 );
	nodeVar110 = exp2( ( ( ( nodeVar109 * -5.55473 ) - 6.98316 ) * nodeVar109 ) );
	nodeVar111 = ( Roughness * Roughness );
	nodeVar112 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar110 ) ) ) + vec3<f32>( ( 1.0 * nodeVar110 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar111, clamp( dot( normalView, nodeVar92 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar111, clamp( dot( normalView, nodeVar108 ), 0.0, 1.0 ) ) ) );
	nodeVar113 = ( nodeVar95 * nodeVar112 );
	nodeVar114 = ( nodeVar113 * multiScatteringCompensation );
	nodeVar115 = ( directSpecular + nodeVar114 );
	directSpecular = nodeVar115;
	nodeVar116 = ( render.nodeUniform16 - render.nodeUniform17 );
	nodeVar117 = vec4<f32>( nodeVar116, 0.0 );
	nodeVar118 = ( render.cameraViewMatrix * nodeVar117 );
	nodeVar119 = normalize( nodeVar118.xyz );
	nodeVar120 = nodeVar119;
	nodeVar121 = dot( normalView, nodeVar120 );
	shadowPositionWorld = v_positionWorld;
	nodeVar123 = ( render.nodeUniform19 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform20 ) ) ), 1.0 ) );
	nodeVar124 = ( nodeVar123.xyz / vec3<f32>( nodeVar123.w ) );
	nodeVar125 = vec3<f32>( nodeVar124.x, ( 1.0 - nodeVar124.y ), ( nodeVar124.z + render.nodeUniform21 ) );

	if ( ( ( ( ( ( nodeVar125.x >= 0.0 ) && ( nodeVar125.x <= 1.0 ) ) && ( nodeVar125.y >= 0.0 ) ) && ( nodeVar125.y <= 1.0 ) ) && ( nodeVar125.z <= 1.0 ) ) ) {

		nodeVar126 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar127 = ( render.nodeUniform23 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform24 ).x );
		nodeVar128 = ( nodeVar125.xy + ( vogelDiskSample( 0, 5, nodeVar126 ) * vec2<f32>( nodeVar127 ) ) );
		nodeVar129 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar128, nodeVar125.z );
		nodeVar130 = ( nodeVar125.xy + ( vogelDiskSample( 1, 5, nodeVar126 ) * vec2<f32>( nodeVar127 ) ) );
		nodeVar131 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar130, nodeVar125.z );
		nodeVar132 = ( nodeVar125.xy + ( vogelDiskSample( 2, 5, nodeVar126 ) * vec2<f32>( nodeVar127 ) ) );
		nodeVar133 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar132, nodeVar125.z );
		nodeVar134 = ( nodeVar125.xy + ( vogelDiskSample( 3, 5, nodeVar126 ) * vec2<f32>( nodeVar127 ) ) );
		nodeVar135 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar134, nodeVar125.z );
		nodeVar136 = ( nodeVar125.xy + ( vogelDiskSample( 4, 5, nodeVar126 ) * vec2<f32>( nodeVar127 ) ) );
		nodeVar137 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar136, nodeVar125.z );
		nodeVar122 = ( ( ( ( ( nodeVar129 + nodeVar131 ) + nodeVar133 ) + nodeVar135 ) + nodeVar137 ) * 0.2 );

	} else {

		nodeVar122 = 1.0;

	}

	nodeVar138 = mix( 1.0, nodeVar122, render.nodeUniform25 );
	nodeVar139 = ( vec3<f32>( clamp( nodeVar121, 0.0, 1.0 ) ) * ( render.nodeUniform18 * vec3<f32>( nodeVar138 ) ) );
	nodeVar140 = nodeVar139;
	nodeVar141 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar142 = ( nodeVar140 * nodeVar141 );
	nodeVar143 = ( nodeVar120 + positionViewDirection );
	nodeVar144 = normalize( nodeVar143 );
	nodeVar145 = dot( positionViewDirection, nodeVar144 );
	nodeVar146 = clamp( nodeVar145, 0.0, 1.0 );
	nodeVar147 = exp2( ( ( ( nodeVar146 * -5.55473 ) - 6.98316 ) * nodeVar146 ) );
	nodeVar148 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar147 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar147 ) ) );
	nodeVar149 = ( vec3<f32>( 1.0 ) - nodeVar148 );
	nodeVar150 = nodeVar149;
	nodeVar151 = ( nodeVar142 * nodeVar150 );
	nodeVar152 = ( directDiffuse + nodeVar151 );
	directDiffuse = nodeVar152;
	nodeVar153 = normalize( ( nodeVar120 + positionViewDirection ) );
	nodeVar154 = clamp( dot( positionViewDirection, nodeVar153 ), 0.0, 1.0 );
	nodeVar155 = exp2( ( ( ( nodeVar154 * -5.55473 ) - 6.98316 ) * nodeVar154 ) );
	nodeVar156 = ( Roughness * Roughness );
	nodeVar157 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar155 ) ) ) + vec3<f32>( ( 1.0 * nodeVar155 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar156, clamp( dot( normalView, nodeVar120 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar156, clamp( dot( normalView, nodeVar153 ), 0.0, 1.0 ) ) ) );
	nodeVar158 = ( nodeVar140 * nodeVar157 );
	nodeVar159 = ( nodeVar158 * multiScatteringCompensation );
	nodeVar160 = ( directSpecular + nodeVar159 );
	directSpecular = nodeVar160;
	nodeVar161 = ( render.nodeUniform26 - v_positionView );
	nodeVar162 = normalize( nodeVar161 );
	nodeVar163 = dot( normalView, nodeVar162 );

	if ( ( render.nodeUniform28 > 0.0 ) ) {

		nodeVar165 = length( nodeVar161 );
		nodeVar166 = ( nodeVar165 / render.nodeUniform28 );
		nodeVar167 = clamp( ( 1.0 - ( ( ( nodeVar166 * nodeVar166 ) * nodeVar166 ) * nodeVar166 ) ), 0.0, 1.0 );
		nodeVar164 = ( ( 1.0 / max( pow( nodeVar165, render.nodeUniform29 ), 0.01 ) ) * ( nodeVar167 * nodeVar167 ) );

	} else {

		nodeVar164 = ( 1.0 / max( pow( length( nodeVar161 ), render.nodeUniform29 ), 0.01 ) );

	}

	nodeVar168 = ( render.nodeUniform27 * vec3<f32>( nodeVar164 ) );
	nodeVar169 = ( vec3<f32>( clamp( nodeVar163, 0.0, 1.0 ) ) * nodeVar168 );
	nodeVar170 = nodeVar169;
	nodeVar171 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar172 = ( nodeVar170 * nodeVar171 );
	nodeVar173 = ( nodeVar162 + positionViewDirection );
	nodeVar174 = normalize( nodeVar173 );
	nodeVar175 = dot( positionViewDirection, nodeVar174 );
	nodeVar176 = clamp( nodeVar175, 0.0, 1.0 );
	nodeVar177 = exp2( ( ( ( nodeVar176 * -5.55473 ) - 6.98316 ) * nodeVar176 ) );
	nodeVar178 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar177 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar177 ) ) );
	nodeVar179 = ( vec3<f32>( 1.0 ) - nodeVar178 );
	nodeVar180 = nodeVar179;
	nodeVar181 = ( nodeVar172 * nodeVar180 );
	nodeVar182 = ( directDiffuse + nodeVar181 );
	directDiffuse = nodeVar182;
	nodeVar183 = normalize( ( nodeVar162 + positionViewDirection ) );
	nodeVar184 = clamp( dot( positionViewDirection, nodeVar183 ), 0.0, 1.0 );
	nodeVar185 = exp2( ( ( ( nodeVar184 * -5.55473 ) - 6.98316 ) * nodeVar184 ) );
	nodeVar186 = ( Roughness * Roughness );
	nodeVar187 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar185 ) ) ) + vec3<f32>( ( 1.0 * nodeVar185 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar186, clamp( dot( normalView, nodeVar162 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar186, clamp( dot( normalView, nodeVar183 ), 0.0, 1.0 ) ) ) );
	nodeVar188 = ( nodeVar170 * nodeVar187 );
	nodeVar189 = ( nodeVar188 * multiScatteringCompensation );
	nodeVar190 = ( directSpecular + nodeVar189 );
	directSpecular = nodeVar190;
	nodeVar191 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar192 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar193 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar194 = ( SpecularF90 * dfg.y );
	nodeVar195 = ( nodeVar193 + vec3<f32>( nodeVar194 ) );
	nodeVar196 = ( nodeVar191 + nodeVar195 );
	nodeVar191 = nodeVar196;
	nodeVar197 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar198 = nodeVar197;
	nodeVar199 = ( nodeVar198 * vec3<f32>( 0.047619 ) );
	nodeVar200 = ( SpecularColor + nodeVar199 );
	nodeVar201 = ( nodeVar195 * nodeVar200 );
	nodeVar202 = ( dfg.x + dfg.y );
	nodeVar203 = ( 1.0 - nodeVar202 );
	nodeVar204 = nodeVar203;
	nodeVar205 = ( vec3<f32>( nodeVar204 ) * nodeVar200 );
	nodeVar206 = ( vec3<f32>( 1.0 ) - nodeVar205 );
	nodeVar207 = nodeVar206;
	nodeVar208 = ( nodeVar201 / nodeVar207 );
	nodeVar209 = ( nodeVar208 * vec3<f32>( nodeVar204 ) );
	nodeVar210 = ( nodeVar192 + nodeVar209 );
	nodeVar192 = nodeVar210;
	nodeVar211 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar212 = ( irradiance * nodeVar211 );
	nodeVar213 = ( nodeVar191 + nodeVar192 );
	nodeVar214 = ( vec3<f32>( 1.0 ) - nodeVar213 );
	nodeVar215 = nodeVar214;
	nodeVar216 = ( nodeVar212 * nodeVar215 );
	nodeVar217 = nodeVar216;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar218 = ( indirectDiffuse + nodeVar217 );
	indirectDiffuse = nodeVar218;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar219 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar220 = ( SpecularF90 * dfg.y );
	nodeVar221 = ( nodeVar219 + vec3<f32>( nodeVar220 ) );
	nodeVar222 = ( singleScatteringDielectric + nodeVar221 );
	singleScatteringDielectric = nodeVar222;
	nodeVar223 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar224 = nodeVar223;
	nodeVar225 = ( nodeVar224 * vec3<f32>( 0.047619 ) );
	nodeVar226 = ( SpecularColor + nodeVar225 );
	nodeVar227 = ( nodeVar221 * nodeVar226 );
	nodeVar228 = ( dfg.x + dfg.y );
	nodeVar229 = ( 1.0 - nodeVar228 );
	nodeVar230 = nodeVar229;
	nodeVar231 = ( vec3<f32>( nodeVar230 ) * nodeVar226 );
	nodeVar232 = ( vec3<f32>( 1.0 ) - nodeVar231 );
	nodeVar233 = nodeVar232;
	nodeVar234 = ( nodeVar227 / nodeVar233 );
	nodeVar235 = ( nodeVar234 * vec3<f32>( nodeVar230 ) );
	nodeVar236 = ( multiScatteringDielectric + nodeVar235 );
	multiScatteringDielectric = nodeVar236;
	nodeVar237 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar238 = ( SpecularF90 * dfg.y );
	nodeVar239 = ( nodeVar237 + vec3<f32>( nodeVar238 ) );
	nodeVar240 = ( singleScatteringMetallic + nodeVar239 );
	singleScatteringMetallic = nodeVar240;
	nodeVar241 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar242 = nodeVar241;
	nodeVar243 = ( nodeVar242 * vec3<f32>( 0.047619 ) );
	nodeVar244 = ( DiffuseColor.xyz + nodeVar243 );
	nodeVar245 = ( nodeVar239 * nodeVar244 );
	nodeVar246 = ( dfg.x + dfg.y );
	nodeVar247 = ( 1.0 - nodeVar246 );
	nodeVar248 = nodeVar247;
	nodeVar249 = ( vec3<f32>( nodeVar248 ) * nodeVar244 );
	nodeVar250 = ( vec3<f32>( 1.0 ) - nodeVar249 );
	nodeVar251 = nodeVar250;
	nodeVar252 = ( nodeVar245 / nodeVar251 );
	nodeVar253 = ( nodeVar252 * vec3<f32>( nodeVar248 ) );
	nodeVar254 = ( multiScatteringMetallic + nodeVar253 );
	multiScatteringMetallic = nodeVar254;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar255 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar256 = ( radiance * nodeVar255 );
	nodeVar257 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar258 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar259 = ( nodeVar257 * nodeVar258 );
	nodeVar260 = ( nodeVar256 + nodeVar259 );
	nodeVar261 = nodeVar260;
	nodeVar262 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar263 = ( vec3<f32>( 1.0 ) - nodeVar262 );
	nodeVar264 = nodeVar263;
	nodeVar265 = ( DiffuseContribution * nodeVar264 );
	nodeVar266 = ( nodeVar265 * nodeVar258 );
	nodeVar267 = nodeVar266;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar268 = ( indirectSpecular + nodeVar261 );
	indirectSpecular = nodeVar268;
	nodeVar269 = ( indirectDiffuse + nodeVar267 );
	indirectDiffuse = nodeVar269;
	ambientOcclusion = 1.0;
	nodeVar270 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar270;
	nodeVar271 = dot( normalView, positionViewDirection );
	nodeVar272 = ( clamp( nodeVar271, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar273 = ( Roughness * -16.0 );
	nodeVar274 = ( 1.0 - nodeVar273 );
	nodeVar275 = nodeVar274;
	nodeVar276 = ( - nodeVar275 );
	nodeVar277 = exp2( nodeVar276 );
	nodeVar278 = pow( nodeVar272, nodeVar277 );
	nodeVar279 = ( 1.0 - nodeVar278 );
	nodeVar280 = nodeVar279;
	nodeVar281 = ( ambientOcclusion - nodeVar280 );
	nodeVar282 = ( indirectSpecular * vec3<f32>( clamp( nodeVar281, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar282;
	nodeVar283 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar283;
	nodeVar284 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar284;
	nodeVar285 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar285;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar286 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar287 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform30, object.nodeUniform31, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform33 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform34 * object.nodeUniform34 ) * nodeVar286 ) * nodeVar286 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar287;

	// result

	output.color = nodeVar287;

	return output;

}
