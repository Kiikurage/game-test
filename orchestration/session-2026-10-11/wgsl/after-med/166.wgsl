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

struct NodeBuffer_11296Struct {
	value : array< vec4<f32>, 8 >
};
@binding( 3 ) @group( 1 )
var<uniform> NodeBuffer_11296 : NodeBuffer_11296Struct;

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
var<private> nodeVar75 : vec3<f32>;
var<private> nodeVar76 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar77 : f32;
var<private> nodeVar78 : vec2<f32>;
var<private> nodeVar79 : f32;
var<private> nodeVar80 : f32;
var<private> nodeVar81 : f32;
var<private> nodeVar82 : f32;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar85 : f32;
var<private> nodeVar86 : f32;
var<private> nodeVar87 : f32;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : vec4<f32>;
var<private> nodeVar92 : vec4<f32>;
var<private> nodeVar93 : vec3<f32>;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : f32;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar98 : vec3<f32>;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : f32;
var<private> nodeVar103 : f32;
var<private> nodeVar104 : f32;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : f32;
var<private> nodeVar112 : f32;
var<private> nodeVar113 : f32;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : vec4<f32>;
var<private> nodeVar120 : vec4<f32>;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar124 : f32;
var<private> nodeVar125 : vec4<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : f32;
var<private> nodeVar129 : f32;
var<private> nodeVar130 : vec2<f32>;
var<private> nodeVar131 : f32;
var<private> nodeVar132 : vec2<f32>;
var<private> nodeVar133 : f32;
var<private> nodeVar134 : vec2<f32>;
var<private> nodeVar135 : f32;
var<private> nodeVar136 : vec2<f32>;
var<private> nodeVar137 : f32;
var<private> nodeVar138 : vec2<f32>;
var<private> nodeVar139 : f32;
var<private> nodeVar140 : f32;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : f32;
var<private> nodeVar148 : f32;
var<private> nodeVar149 : f32;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : f32;
var<private> nodeVar157 : f32;
var<private> nodeVar158 : f32;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : f32;
var<private> nodeVar166 : f32;
var<private> nodeVar167 : f32;
var<private> nodeVar168 : f32;
var<private> nodeVar169 : f32;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : f32;
var<private> nodeVar178 : f32;
var<private> nodeVar179 : f32;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : f32;
var<private> nodeVar187 : f32;
var<private> nodeVar188 : f32;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : f32;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : f32;
var<private> nodeVar205 : f32;
var<private> nodeVar206 : f32;
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
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : f32;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : f32;
var<private> nodeVar231 : f32;
var<private> nodeVar232 : f32;
var<private> nodeVar233 : vec3<f32>;
var<private> nodeVar234 : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> nodeVar236 : vec3<f32>;
var<private> nodeVar237 : vec3<f32>;
var<private> nodeVar238 : vec3<f32>;
var<private> nodeVar239 : vec3<f32>;
var<private> nodeVar240 : f32;
var<private> nodeVar241 : vec3<f32>;
var<private> nodeVar242 : vec3<f32>;
var<private> nodeVar243 : vec3<f32>;
var<private> nodeVar244 : vec3<f32>;
var<private> nodeVar245 : vec3<f32>;
var<private> nodeVar246 : vec3<f32>;
var<private> nodeVar247 : vec3<f32>;
var<private> nodeVar248 : f32;
var<private> nodeVar249 : f32;
var<private> nodeVar250 : f32;
var<private> nodeVar251 : vec3<f32>;
var<private> nodeVar252 : vec3<f32>;
var<private> nodeVar253 : vec3<f32>;
var<private> nodeVar254 : vec3<f32>;
var<private> nodeVar255 : vec3<f32>;
var<private> nodeVar256 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar257 : vec3<f32>;
var<private> nodeVar258 : vec3<f32>;
var<private> nodeVar259 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar260 : vec3<f32>;
var<private> nodeVar261 : vec3<f32>;
var<private> nodeVar262 : vec3<f32>;
var<private> nodeVar263 : vec3<f32>;
var<private> nodeVar264 : vec3<f32>;
var<private> nodeVar265 : vec3<f32>;
var<private> nodeVar266 : vec3<f32>;
var<private> nodeVar267 : vec3<f32>;
var<private> nodeVar268 : vec3<f32>;
var<private> nodeVar269 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar270 : vec3<f32>;
var<private> nodeVar271 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar272 : vec3<f32>;
var<private> nodeVar273 : f32;
var<private> nodeVar274 : f32;
var<private> nodeVar275 : f32;
var<private> nodeVar276 : f32;
var<private> nodeVar277 : f32;
var<private> nodeVar278 : f32;
var<private> nodeVar279 : f32;
var<private> nodeVar280 : f32;
var<private> nodeVar281 : f32;
var<private> nodeVar282 : f32;
var<private> nodeVar283 : f32;
var<private> nodeVar284 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar285 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar286 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar287 : vec3<f32>;
var<private> nodeVar288 : f32;
var<private> nodeVar289 : vec4<f32>;

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
	nodeVar55 = ( NodeBuffer_11296.value[ 0u ].xyz - v_positionWorld );
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
	nodeVar63 = ( NodeBuffer_11296.value[ 1u ].xyz - v_positionWorld );
	nodeVar64 = dot( nodeVar63, nodeVar63 );
	nodeVar65 = ( NodeBuffer_11296.value[ 2u ].xyz - v_positionWorld );
	nodeVar66 = dot( nodeVar65, nodeVar65 );
	nodeVar67 = ( NodeBuffer_11296.value[ 3u ].xyz - v_positionWorld );
	nodeVar68 = dot( nodeVar67, nodeVar67 );
	nodeVar69 = ( NodeBuffer_11296.value[ 4u ].xyz - v_positionWorld );
	nodeVar70 = dot( nodeVar69, nodeVar69 );
	nodeVar71 = ( NodeBuffer_11296.value[ 5u ].xyz - v_positionWorld );
	nodeVar72 = dot( nodeVar71, nodeVar71 );
	nodeVar73 = ( NodeBuffer_11296.value[ 6u ].xyz - v_positionWorld );
	nodeVar74 = dot( nodeVar73, nodeVar73 );
	nodeVar75 = ( NodeBuffer_11296.value[ 7u ].xyz - v_positionWorld );
	nodeVar76 = dot( nodeVar75, nodeVar75 );
	EmissiveColor = ( nodeVar53 * ( ( ( ( ( ( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_11296.value[ 0u ].w * ( 1.0 / ( 1.0 + ( nodeVar56 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar55 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar56 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 0.0 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 0.0 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_11296.value[ 1u ].w * ( 1.0 / ( 1.0 + ( nodeVar64 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar63 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar64 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 2.13 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 2.13 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_11296.value[ 2u ].w * ( 1.0 / ( 1.0 + ( nodeVar66 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar65 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar66 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 4.26 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 4.26 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_11296.value[ 3u ].w * ( 1.0 / ( 1.0 + ( nodeVar68 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar67 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar68 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 6.39 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 6.39 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_11296.value[ 4u ].w * ( 1.0 / ( 1.0 + ( nodeVar70 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar69 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar70 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 8.52 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 8.52 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_11296.value[ 5u ].w * ( 1.0 / ( 1.0 + ( nodeVar72 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar71 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar72 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 10.649999999999999 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 10.649999999999999 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_11296.value[ 6u ].w * ( 1.0 / ( 1.0 + ( nodeVar74 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar73 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar74 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 12.78 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 12.78 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_11296.value[ 7u ].w * ( 1.0 / ( 1.0 + ( nodeVar76 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar75 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar76 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 14.91 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 14.91 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar77 = dot( normalView, positionViewDirection );
	nodeVar78 = textureSample( nodeUniform9, nodeUniform9_sampler, vec2<f32>( Roughness, clamp( nodeVar77, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar78;
	nodeVar79 = ( dfg.x + dfg.y );
	nodeVar80 = ( 1.0 / nodeVar79 );
	nodeVar81 = nodeVar80;
	nodeVar82 = ( nodeVar81 - 1.0 );
	nodeVar83 = ( SpecularColorBlended * vec3<f32>( nodeVar82 ) );
	nodeVar84 = ( nodeVar83 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar84;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar85 = dot( normalWorld, normalize( render.nodeUniform12 ) );
	nodeVar86 = ( nodeVar85 * 0.5 );
	nodeVar87 = ( nodeVar86 + 0.5 );
	nodeVar88 = mix( render.nodeUniform10, render.nodeUniform11, nodeVar87 );
	nodeVar89 = ( irradiance + nodeVar88 );
	irradiance = nodeVar89;
	nodeVar90 = ( render.nodeUniform13 - render.nodeUniform14 );
	nodeVar91 = vec4<f32>( nodeVar90, 0.0 );
	nodeVar92 = ( render.cameraViewMatrix * nodeVar91 );
	nodeVar93 = normalize( nodeVar92.xyz );
	nodeVar94 = nodeVar93;
	nodeVar95 = dot( normalView, nodeVar94 );
	nodeVar96 = ( vec3<f32>( clamp( nodeVar95, 0.0, 1.0 ) ) * render.nodeUniform15 );
	nodeVar97 = nodeVar96;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar98 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar99 = ( nodeVar97 * nodeVar98 );
	nodeVar100 = ( nodeVar94 + positionViewDirection );
	nodeVar101 = normalize( nodeVar100 );
	nodeVar102 = dot( positionViewDirection, nodeVar101 );
	nodeVar103 = clamp( nodeVar102, 0.0, 1.0 );
	nodeVar104 = exp2( ( ( ( nodeVar103 * -5.55473 ) - 6.98316 ) * nodeVar103 ) );
	nodeVar105 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar104 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar104 ) ) );
	nodeVar106 = ( vec3<f32>( 1.0 ) - nodeVar105 );
	nodeVar107 = nodeVar106;
	nodeVar108 = ( nodeVar99 * nodeVar107 );
	nodeVar109 = ( directDiffuse + nodeVar108 );
	directDiffuse = nodeVar109;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar110 = normalize( ( nodeVar94 + positionViewDirection ) );
	nodeVar111 = clamp( dot( positionViewDirection, nodeVar110 ), 0.0, 1.0 );
	nodeVar112 = exp2( ( ( ( nodeVar111 * -5.55473 ) - 6.98316 ) * nodeVar111 ) );
	nodeVar113 = ( Roughness * Roughness );
	nodeVar114 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar112 ) ) ) + vec3<f32>( ( 1.0 * nodeVar112 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar113, clamp( dot( normalView, nodeVar94 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar113, clamp( dot( normalView, nodeVar110 ), 0.0, 1.0 ) ) ) );
	nodeVar115 = ( nodeVar97 * nodeVar114 );
	nodeVar116 = ( nodeVar115 * multiScatteringCompensation );
	nodeVar117 = ( directSpecular + nodeVar116 );
	directSpecular = nodeVar117;
	nodeVar118 = ( render.nodeUniform16 - render.nodeUniform17 );
	nodeVar119 = vec4<f32>( nodeVar118, 0.0 );
	nodeVar120 = ( render.cameraViewMatrix * nodeVar119 );
	nodeVar121 = normalize( nodeVar120.xyz );
	nodeVar122 = nodeVar121;
	nodeVar123 = dot( normalView, nodeVar122 );
	shadowPositionWorld = v_positionWorld;
	nodeVar125 = ( render.nodeUniform19 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform20 ) ) ), 1.0 ) );
	nodeVar126 = ( nodeVar125.xyz / vec3<f32>( nodeVar125.w ) );
	nodeVar127 = vec3<f32>( nodeVar126.x, ( 1.0 - nodeVar126.y ), ( nodeVar126.z + render.nodeUniform21 ) );

	if ( ( ( ( ( ( nodeVar127.x >= 0.0 ) && ( nodeVar127.x <= 1.0 ) ) && ( nodeVar127.y >= 0.0 ) ) && ( nodeVar127.y <= 1.0 ) ) && ( nodeVar127.z <= 1.0 ) ) ) {

		nodeVar128 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar129 = ( render.nodeUniform23 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform24 ).x );
		nodeVar130 = ( nodeVar127.xy + ( vogelDiskSample( 0, 5, nodeVar128 ) * vec2<f32>( nodeVar129 ) ) );
		nodeVar131 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar130, nodeVar127.z );
		nodeVar132 = ( nodeVar127.xy + ( vogelDiskSample( 1, 5, nodeVar128 ) * vec2<f32>( nodeVar129 ) ) );
		nodeVar133 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar132, nodeVar127.z );
		nodeVar134 = ( nodeVar127.xy + ( vogelDiskSample( 2, 5, nodeVar128 ) * vec2<f32>( nodeVar129 ) ) );
		nodeVar135 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar134, nodeVar127.z );
		nodeVar136 = ( nodeVar127.xy + ( vogelDiskSample( 3, 5, nodeVar128 ) * vec2<f32>( nodeVar129 ) ) );
		nodeVar137 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar136, nodeVar127.z );
		nodeVar138 = ( nodeVar127.xy + ( vogelDiskSample( 4, 5, nodeVar128 ) * vec2<f32>( nodeVar129 ) ) );
		nodeVar139 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar138, nodeVar127.z );
		nodeVar124 = ( ( ( ( ( nodeVar131 + nodeVar133 ) + nodeVar135 ) + nodeVar137 ) + nodeVar139 ) * 0.2 );

	} else {

		nodeVar124 = 1.0;

	}

	nodeVar140 = mix( 1.0, nodeVar124, render.nodeUniform25 );
	nodeVar141 = ( vec3<f32>( clamp( nodeVar123, 0.0, 1.0 ) ) * ( render.nodeUniform18 * vec3<f32>( nodeVar140 ) ) );
	nodeVar142 = nodeVar141;
	nodeVar143 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar144 = ( nodeVar142 * nodeVar143 );
	nodeVar145 = ( nodeVar122 + positionViewDirection );
	nodeVar146 = normalize( nodeVar145 );
	nodeVar147 = dot( positionViewDirection, nodeVar146 );
	nodeVar148 = clamp( nodeVar147, 0.0, 1.0 );
	nodeVar149 = exp2( ( ( ( nodeVar148 * -5.55473 ) - 6.98316 ) * nodeVar148 ) );
	nodeVar150 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar149 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar149 ) ) );
	nodeVar151 = ( vec3<f32>( 1.0 ) - nodeVar150 );
	nodeVar152 = nodeVar151;
	nodeVar153 = ( nodeVar144 * nodeVar152 );
	nodeVar154 = ( directDiffuse + nodeVar153 );
	directDiffuse = nodeVar154;
	nodeVar155 = normalize( ( nodeVar122 + positionViewDirection ) );
	nodeVar156 = clamp( dot( positionViewDirection, nodeVar155 ), 0.0, 1.0 );
	nodeVar157 = exp2( ( ( ( nodeVar156 * -5.55473 ) - 6.98316 ) * nodeVar156 ) );
	nodeVar158 = ( Roughness * Roughness );
	nodeVar159 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar157 ) ) ) + vec3<f32>( ( 1.0 * nodeVar157 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar158, clamp( dot( normalView, nodeVar122 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar158, clamp( dot( normalView, nodeVar155 ), 0.0, 1.0 ) ) ) );
	nodeVar160 = ( nodeVar142 * nodeVar159 );
	nodeVar161 = ( nodeVar160 * multiScatteringCompensation );
	nodeVar162 = ( directSpecular + nodeVar161 );
	directSpecular = nodeVar162;
	nodeVar163 = ( render.nodeUniform26 - v_positionView );
	nodeVar164 = normalize( nodeVar163 );
	nodeVar165 = dot( normalView, nodeVar164 );

	if ( ( render.nodeUniform28 > 0.0 ) ) {

		nodeVar167 = length( nodeVar163 );
		nodeVar168 = ( nodeVar167 / render.nodeUniform28 );
		nodeVar169 = clamp( ( 1.0 - ( ( ( nodeVar168 * nodeVar168 ) * nodeVar168 ) * nodeVar168 ) ), 0.0, 1.0 );
		nodeVar166 = ( ( 1.0 / max( pow( nodeVar167, render.nodeUniform29 ), 0.01 ) ) * ( nodeVar169 * nodeVar169 ) );

	} else {

		nodeVar166 = ( 1.0 / max( pow( length( nodeVar163 ), render.nodeUniform29 ), 0.01 ) );

	}

	nodeVar170 = ( render.nodeUniform27 * vec3<f32>( nodeVar166 ) );
	nodeVar171 = ( vec3<f32>( clamp( nodeVar165, 0.0, 1.0 ) ) * nodeVar170 );
	nodeVar172 = nodeVar171;
	nodeVar173 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar174 = ( nodeVar172 * nodeVar173 );
	nodeVar175 = ( nodeVar164 + positionViewDirection );
	nodeVar176 = normalize( nodeVar175 );
	nodeVar177 = dot( positionViewDirection, nodeVar176 );
	nodeVar178 = clamp( nodeVar177, 0.0, 1.0 );
	nodeVar179 = exp2( ( ( ( nodeVar178 * -5.55473 ) - 6.98316 ) * nodeVar178 ) );
	nodeVar180 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar179 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar179 ) ) );
	nodeVar181 = ( vec3<f32>( 1.0 ) - nodeVar180 );
	nodeVar182 = nodeVar181;
	nodeVar183 = ( nodeVar174 * nodeVar182 );
	nodeVar184 = ( directDiffuse + nodeVar183 );
	directDiffuse = nodeVar184;
	nodeVar185 = normalize( ( nodeVar164 + positionViewDirection ) );
	nodeVar186 = clamp( dot( positionViewDirection, nodeVar185 ), 0.0, 1.0 );
	nodeVar187 = exp2( ( ( ( nodeVar186 * -5.55473 ) - 6.98316 ) * nodeVar186 ) );
	nodeVar188 = ( Roughness * Roughness );
	nodeVar189 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar187 ) ) ) + vec3<f32>( ( 1.0 * nodeVar187 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar188, clamp( dot( normalView, nodeVar164 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar188, clamp( dot( normalView, nodeVar185 ), 0.0, 1.0 ) ) ) );
	nodeVar190 = ( nodeVar172 * nodeVar189 );
	nodeVar191 = ( nodeVar190 * multiScatteringCompensation );
	nodeVar192 = ( directSpecular + nodeVar191 );
	directSpecular = nodeVar192;
	nodeVar193 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar194 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar195 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar196 = ( SpecularF90 * dfg.y );
	nodeVar197 = ( nodeVar195 + vec3<f32>( nodeVar196 ) );
	nodeVar198 = ( nodeVar193 + nodeVar197 );
	nodeVar193 = nodeVar198;
	nodeVar199 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar200 = nodeVar199;
	nodeVar201 = ( nodeVar200 * vec3<f32>( 0.047619 ) );
	nodeVar202 = ( SpecularColor + nodeVar201 );
	nodeVar203 = ( nodeVar197 * nodeVar202 );
	nodeVar204 = ( dfg.x + dfg.y );
	nodeVar205 = ( 1.0 - nodeVar204 );
	nodeVar206 = nodeVar205;
	nodeVar207 = ( vec3<f32>( nodeVar206 ) * nodeVar202 );
	nodeVar208 = ( vec3<f32>( 1.0 ) - nodeVar207 );
	nodeVar209 = nodeVar208;
	nodeVar210 = ( nodeVar203 / nodeVar209 );
	nodeVar211 = ( nodeVar210 * vec3<f32>( nodeVar206 ) );
	nodeVar212 = ( nodeVar194 + nodeVar211 );
	nodeVar194 = nodeVar212;
	nodeVar213 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar214 = ( irradiance * nodeVar213 );
	nodeVar215 = ( nodeVar193 + nodeVar194 );
	nodeVar216 = ( vec3<f32>( 1.0 ) - nodeVar215 );
	nodeVar217 = nodeVar216;
	nodeVar218 = ( nodeVar214 * nodeVar217 );
	nodeVar219 = nodeVar218;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar220 = ( indirectDiffuse + nodeVar219 );
	indirectDiffuse = nodeVar220;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar221 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar222 = ( SpecularF90 * dfg.y );
	nodeVar223 = ( nodeVar221 + vec3<f32>( nodeVar222 ) );
	nodeVar224 = ( singleScatteringDielectric + nodeVar223 );
	singleScatteringDielectric = nodeVar224;
	nodeVar225 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar226 = nodeVar225;
	nodeVar227 = ( nodeVar226 * vec3<f32>( 0.047619 ) );
	nodeVar228 = ( SpecularColor + nodeVar227 );
	nodeVar229 = ( nodeVar223 * nodeVar228 );
	nodeVar230 = ( dfg.x + dfg.y );
	nodeVar231 = ( 1.0 - nodeVar230 );
	nodeVar232 = nodeVar231;
	nodeVar233 = ( vec3<f32>( nodeVar232 ) * nodeVar228 );
	nodeVar234 = ( vec3<f32>( 1.0 ) - nodeVar233 );
	nodeVar235 = nodeVar234;
	nodeVar236 = ( nodeVar229 / nodeVar235 );
	nodeVar237 = ( nodeVar236 * vec3<f32>( nodeVar232 ) );
	nodeVar238 = ( multiScatteringDielectric + nodeVar237 );
	multiScatteringDielectric = nodeVar238;
	nodeVar239 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar240 = ( SpecularF90 * dfg.y );
	nodeVar241 = ( nodeVar239 + vec3<f32>( nodeVar240 ) );
	nodeVar242 = ( singleScatteringMetallic + nodeVar241 );
	singleScatteringMetallic = nodeVar242;
	nodeVar243 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar244 = nodeVar243;
	nodeVar245 = ( nodeVar244 * vec3<f32>( 0.047619 ) );
	nodeVar246 = ( DiffuseColor.xyz + nodeVar245 );
	nodeVar247 = ( nodeVar241 * nodeVar246 );
	nodeVar248 = ( dfg.x + dfg.y );
	nodeVar249 = ( 1.0 - nodeVar248 );
	nodeVar250 = nodeVar249;
	nodeVar251 = ( vec3<f32>( nodeVar250 ) * nodeVar246 );
	nodeVar252 = ( vec3<f32>( 1.0 ) - nodeVar251 );
	nodeVar253 = nodeVar252;
	nodeVar254 = ( nodeVar247 / nodeVar253 );
	nodeVar255 = ( nodeVar254 * vec3<f32>( nodeVar250 ) );
	nodeVar256 = ( multiScatteringMetallic + nodeVar255 );
	multiScatteringMetallic = nodeVar256;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar257 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar258 = ( radiance * nodeVar257 );
	nodeVar259 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar260 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar261 = ( nodeVar259 * nodeVar260 );
	nodeVar262 = ( nodeVar258 + nodeVar261 );
	nodeVar263 = nodeVar262;
	nodeVar264 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar265 = ( vec3<f32>( 1.0 ) - nodeVar264 );
	nodeVar266 = nodeVar265;
	nodeVar267 = ( DiffuseContribution * nodeVar266 );
	nodeVar268 = ( nodeVar267 * nodeVar260 );
	nodeVar269 = nodeVar268;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar270 = ( indirectSpecular + nodeVar263 );
	indirectSpecular = nodeVar270;
	nodeVar271 = ( indirectDiffuse + nodeVar269 );
	indirectDiffuse = nodeVar271;
	ambientOcclusion = 1.0;
	nodeVar272 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar272;
	nodeVar273 = dot( normalView, positionViewDirection );
	nodeVar274 = ( clamp( nodeVar273, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar275 = ( Roughness * -16.0 );
	nodeVar276 = ( 1.0 - nodeVar275 );
	nodeVar277 = nodeVar276;
	nodeVar278 = ( - nodeVar277 );
	nodeVar279 = exp2( nodeVar278 );
	nodeVar280 = pow( nodeVar274, nodeVar279 );
	nodeVar281 = ( 1.0 - nodeVar280 );
	nodeVar282 = nodeVar281;
	nodeVar283 = ( ambientOcclusion - nodeVar282 );
	nodeVar284 = ( indirectSpecular * vec3<f32>( clamp( nodeVar283, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar284;
	nodeVar285 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar285;
	nodeVar286 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar286;
	nodeVar287 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar287;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar288 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar289 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform30, object.nodeUniform31, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform33 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform34 * object.nodeUniform34 ) * nodeVar288 ) * nodeVar288 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar289;

	// result

	output.color = nodeVar289;

	return output;

}
