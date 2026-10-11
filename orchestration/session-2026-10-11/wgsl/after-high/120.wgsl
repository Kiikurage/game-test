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
@binding( 3 ) @group( 1 ) var nodeUniform7_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform7 : texture_2d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform22_sampler : sampler_comparison;
@binding( 6 ) @group( 1 ) var nodeUniform22 : texture_depth_2d;

struct objectStruct {
	nodeUniform1 : f32,
	nodeUniform2 : f32,
	nodeUniform4 : mat3x3<f32>,
	nodeUniform5 : vec3<f32>,
	nodeUniform6 : f32,
	nodeUniform8 : mat4x4<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform31 : vec3<f32>,
	nodeUniform33 : vec3<f32>,
	nodeUniform34 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform10 : vec3<f32>,
	nodeUniform12 : vec3<f32>,
	nodeUniform9 : vec3<f32>,
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
var<private> nodeVar23 : vec3<f32>;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : vec2<f32>;
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
var<private> nodeVar37 : vec3<f32>;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : f32;
var<private> nodeVar40 : vec2<f32>;
var<private> nodeVar41 : vec3<f32>;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : f32;
var<private> nodeVar44 : vec2<f32>;
var<private> nodeVar45 : f32;
var<private> nodeVar46 : f32;
var<private> nodeVar47 : f32;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : f32;
var<private> nodeVar51 : f32;
var<private> nodeVar52 : vec2<f32>;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : f32;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : f32;
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : f32;
var<private> nodeVar60 : f32;
var<private> nodeVar61 : vec2<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar62 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> nodeVar63 : vec3<f32>;
var<private> nodeVar64 : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> NORMAL_nodeVar65 : vec3<f32>;
var<private> NORMAL_nodeVar66 : f32;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : f32;
var<private> nodeVar69 : f32;
var<private> nodeVar70 : vec2<f32>;
var<private> nodeVar71 : f32;
var<private> nodeVar72 : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar73 : f32;
var<private> nodeVar74 : vec2<f32>;
var<private> nodeVar75 : f32;
var<private> nodeVar76 : f32;
var<private> nodeVar77 : f32;
var<private> nodeVar78 : f32;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar81 : f32;
var<private> nodeVar82 : f32;
var<private> nodeVar83 : f32;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : vec3<f32>;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : vec4<f32>;
var<private> nodeVar88 : vec4<f32>;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : f32;
var<private> nodeVar92 : vec3<f32>;
var<private> nodeVar93 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : f32;
var<private> nodeVar99 : f32;
var<private> nodeVar100 : f32;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : f32;
var<private> nodeVar108 : f32;
var<private> nodeVar109 : f32;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec4<f32>;
var<private> nodeVar116 : vec4<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : vec4<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : f32;
var<private> nodeVar125 : f32;
var<private> nodeVar126 : vec2<f32>;
var<private> nodeVar127 : f32;
var<private> nodeVar128 : vec2<f32>;
var<private> nodeVar129 : f32;
var<private> nodeVar130 : vec2<f32>;
var<private> nodeVar131 : f32;
var<private> nodeVar132 : vec2<f32>;
var<private> nodeVar133 : f32;
var<private> nodeVar134 : vec2<f32>;
var<private> nodeVar135 : f32;
var<private> nodeVar136 : f32;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : f32;
var<private> nodeVar144 : f32;
var<private> nodeVar145 : f32;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : f32;
var<private> nodeVar153 : f32;
var<private> nodeVar154 : f32;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : f32;
var<private> nodeVar162 : f32;
var<private> nodeVar163 : f32;
var<private> nodeVar164 : f32;
var<private> nodeVar165 : f32;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : f32;
var<private> nodeVar174 : f32;
var<private> nodeVar175 : f32;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : f32;
var<private> nodeVar183 : f32;
var<private> nodeVar184 : f32;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : f32;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : f32;
var<private> nodeVar201 : f32;
var<private> nodeVar202 : f32;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
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
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : f32;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : f32;
var<private> nodeVar227 : f32;
var<private> nodeVar228 : f32;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> nodeVar233 : vec3<f32>;
var<private> nodeVar234 : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> nodeVar236 : f32;
var<private> nodeVar237 : vec3<f32>;
var<private> nodeVar238 : vec3<f32>;
var<private> nodeVar239 : vec3<f32>;
var<private> nodeVar240 : vec3<f32>;
var<private> nodeVar241 : vec3<f32>;
var<private> nodeVar242 : vec3<f32>;
var<private> nodeVar243 : vec3<f32>;
var<private> nodeVar244 : f32;
var<private> nodeVar245 : f32;
var<private> nodeVar246 : f32;
var<private> nodeVar247 : vec3<f32>;
var<private> nodeVar248 : vec3<f32>;
var<private> nodeVar249 : vec3<f32>;
var<private> nodeVar250 : vec3<f32>;
var<private> nodeVar251 : vec3<f32>;
var<private> nodeVar252 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar253 : vec3<f32>;
var<private> nodeVar254 : vec3<f32>;
var<private> nodeVar255 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar256 : vec3<f32>;
var<private> nodeVar257 : vec3<f32>;
var<private> nodeVar258 : vec3<f32>;
var<private> nodeVar259 : vec3<f32>;
var<private> nodeVar260 : vec3<f32>;
var<private> nodeVar261 : vec3<f32>;
var<private> nodeVar262 : vec3<f32>;
var<private> nodeVar263 : vec3<f32>;
var<private> nodeVar264 : vec3<f32>;
var<private> nodeVar265 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar266 : vec3<f32>;
var<private> nodeVar267 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar268 : vec3<f32>;
var<private> nodeVar269 : f32;
var<private> nodeVar270 : f32;
var<private> nodeVar271 : f32;
var<private> nodeVar272 : f32;
var<private> nodeVar273 : f32;
var<private> nodeVar274 : f32;
var<private> nodeVar275 : f32;
var<private> nodeVar276 : f32;
var<private> nodeVar277 : f32;
var<private> nodeVar278 : f32;
var<private> nodeVar279 : f32;
var<private> nodeVar280 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar281 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar282 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar283 : vec3<f32>;
var<private> nodeVar284 : f32;
var<private> nodeVar285 : vec4<f32>;

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
	@location( 2 ) v_positionViewDirection : vec3<f32>,
	@location( 3 ) v_positionWorld : vec3<f32>,
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
	nodeVar22 = vec3<f32>( ( nodeVarying8.x * 6.3 ), ( nodeVarying8.y * 6.3 ), ( nodeVar15 * 0.37 ) );
	nodeVar23 = fract( ( nodeVar22 / vec3<f32>( 8.0 ) ) );
	nodeVar24 = ( nodeVar23.z * 64.0 );
	nodeVar25 = floor( nodeVar24 );
	nodeVar26 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar25, 8.0 ), floor( ( nodeVar25 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar23.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar27 = mix( nodeVar26.x, nodeVar26.y, ( nodeVar24 - nodeVar25 ) );
	nodeVar28 = fract( ( vec3<f32>( ( nodeVarying8.x * 21.0 ), ( nodeVarying8.y * 21.0 ), nodeVar15 ) / vec3<f32>( 8.0 ) ) );
	nodeVar29 = ( nodeVar28.z * 64.0 );
	nodeVar30 = floor( nodeVar29 );
	nodeVar31 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar30, 8.0 ), floor( ( nodeVar30 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar28.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar32 = fract( ( ( nodeVar22 * vec3<f32>( 2.6 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar33 = ( nodeVar32.z * 64.0 );
	nodeVar34 = floor( nodeVar33 );
	nodeVar35 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar34, 8.0 ), floor( ( nodeVar34 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar32.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar36 = smoothstep( 0.4, 0.7, mix( nodeVar35.x, nodeVar35.y, ( nodeVar33 - nodeVar34 ) ) );
	nodeVar37 = fract( ( vec3<f32>( ( nodeVarying8.x * 0.85 ), ( nodeVarying8.y * 0.16 ), 3.3 ) / vec3<f32>( 8.0 ) ) );
	nodeVar38 = ( nodeVar37.z * 64.0 );
	nodeVar39 = floor( nodeVar38 );
	nodeVar40 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar39, 8.0 ), floor( ( nodeVar39 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar37.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar41 = fract( ( vec3<f32>( ( nodeVarying8.x * 0.5 ), ( nodeVarying8.y * 0.45 ), 8.2 ) / vec3<f32>( 8.0 ) ) );
	nodeVar42 = ( nodeVar41.z * 64.0 );
	nodeVar43 = floor( nodeVar42 );
	nodeVar44 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar43, 8.0 ), floor( ( nodeVar43 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar41.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar45 = mix( nodeVar44.x, nodeVar44.y, ( nodeVar42 - nodeVar43 ) );
	nodeVar46 = fract( nodeVar13 );
	nodeVar47 = mix( nodeVar3, ( 0.72 - nodeVar3 ), nodeVar5 );
	nodeVar48 = ( ( nodeVar4 - ( nodeVar5 * nodeVar3 ) ) / nodeVar47 );
	nodeVar49 = fract( ( vec3<f32>( ( nodeVarying8.x * 7.1 ), ( nodeVarying8.y * 7.1 ), 1.7 ) / vec3<f32>( 8.0 ) ) );
	nodeVar50 = ( nodeVar49.z * 64.0 );
	nodeVar51 = floor( nodeVar50 );
	nodeVar52 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar51, 8.0 ), floor( ( nodeVar51 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar49.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar53 = ( min( ( min( nodeVar46, ( 1.0 - nodeVar46 ) ) * nodeVar10 ), ( min( nodeVar48, ( 1.0 - nodeVar48 ) ) * nodeVar47 ) ) + ( mix( nodeVar52.x, nodeVar52.y, ( nodeVar50 - nodeVar51 ) ) * 0.011 ) );
	nodeVar54 = max( fwidth( nodeVarying8.x ), fwidth( nodeVarying8.y ) );
	nodeVar55 = ( ( nodeVar54 * 0.75 ) + 0.0015 );
	nodeVar56 = mix( ( 1.0 - smoothstep( ( 0.024 - nodeVar55 ), ( 0.024 + nodeVar55 ), nodeVar53 ) ), 0.17, smoothstep( 0.1, 0.34, nodeVar54 ) );
	nodeVar57 = smoothstep( 1.7, 0.0, ( ( nodeVarying10.z + ( nodeVar27 * 0.35 ) ) + ( nodeVar45 * 0.4 ) ) );
	nodeVar58 = fract( ( vec3<f32>( ( nodeVarying8.x * 2.4 ), ( nodeVarying8.y * 2.4 ), 9.1 ) / vec3<f32>( 8.0 ) ) );
	nodeVar59 = ( nodeVar58.z * 64.0 );
	nodeVar60 = floor( nodeVar59 );
	nodeVar61 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar60, 8.0 ), floor( ( nodeVar60 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar58.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	DiffuseColor = vec4<f32>( mix( ( ( nodeVarying7 * vec3<f32>( ( 1.0 + ( nodeVar18 * 0.12 ) ), ( 1.0 - ( nodeVar18 * 0.02 ) ), ( 1.0 - ( nodeVar18 * 0.14 ) ) ) ) * vec3<f32>( max( ( ( ( ( ( ( ( ( ( ( nodeVar21 + ( nodeVar27 * 0.11 ) ) + ( mix( nodeVar31.x, nodeVar31.y, ( nodeVar29 - nodeVar30 ) ) * 0.07 ) ) + ( nodeVar36 * 0.07 ) ) + ( mix( nodeVar40.x, nodeVar40.y, ( nodeVar38 - nodeVar39 ) ) * 0.1 ) ) + ( nodeVar45 * 0.12 ) ) + ( smoothstep( 0.32, 0.0, ( min( nodeVarying10.x, nodeVarying10.y ) + ( nodeVar27 * 0.08 ) ) ) * 0.16 ) ) + ( ( smoothstep( 0.08, 0.035, nodeVar53 ) * ( 1.0 - nodeVar56 ) ) * 0.1 ) ) * ( ( smoothstep( 0.0, 0.2, nodeVar53 ) * 0.16 ) + 0.84 ) ) * ( 1.0 - ( nodeVar57 * 0.4 ) ) ) * ( 1.0 - ( nodeVar56 * 0.65 ) ) ), 0.0 ) ) ), ( vec3<f32>( 0.07, 0.09, 0.03 ) * vec3<f32>( nodeVar21 ) ), ( ( ( ( nodeVar57 * smoothstep( 0.0, 0.55, ( mix( nodeVar61.x, nodeVar61.y, ( nodeVar59 - nodeVar60 ) ) + 0.15 ) ) ) * smoothstep( 1.1, 0.0, nodeVarying10.z ) ) * ( 1.0 - nodeVar56 ) ) * 0.6 ) ), 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform1 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform2;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar62 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( mix( 0.93, 0.5, ( nodeVar57 * 0.75 ) ), 0.0525 ) + max( max( nodeVar62.x, nodeVar62.y ), nodeVar62.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform2 ) ) );
	EmissiveColor = ( object.nodeUniform5 * vec3<f32>( object.nodeUniform6 ) );
	nodeVar63 = dpdx( v_positionView );
	nodeVar64 = - dpdy( v_positionView );
	NORMAL_normalView = normalViewGeometry;
	NORMAL_nodeVar65 = cross( nodeVar64, NORMAL_normalView );
	NORMAL_nodeVar66 = dot( nodeVar63, NORMAL_nodeVar65 );
	nodeVar67 = fract( ( vec3<f32>( ( nodeVarying8.x * 13.0 ), ( nodeVarying8.y * 13.0 ), nodeVar6 ) / vec3<f32>( 8.0 ) ) );
	nodeVar68 = ( nodeVar67.z * 64.0 );
	nodeVar69 = floor( nodeVar68 );
	nodeVar70 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar69, 8.0 ), floor( ( nodeVar69 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar67.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar71 = ( ( ( ( ( smoothstep( 0.0, 0.07, nodeVar53 ) * 0.014 ) + ( smoothstep( 0.0, 0.02, nodeVar53 ) * 0.006 ) ) + ( mix( nodeVar70.x, nodeVar70.y, ( nodeVar68 - nodeVar69 ) ) * 0.006 ) ) + ( nodeVar36 * -0.004 ) ) * ( 1.0 - smoothstep( 0.05, 0.22, nodeVar54 ) ) );
	nodeVar72 = ( vec3<f32>( sign( NORMAL_nodeVar66 ) ) * ( ( vec3<f32>( dpdx( nodeVar71 ) ) * NORMAL_nodeVar65 ) + ( vec3<f32>( - dpdy( nodeVar71 ) ) * cross( NORMAL_normalView, nodeVar63 ) ) ) );
	normalView = normalize( ( ( vec3<f32>( abs( NORMAL_nodeVar66 ) ) * NORMAL_normalView ) - nodeVar72 ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar73 = dot( normalView, positionViewDirection );
	nodeVar74 = textureSample( nodeUniform7, nodeUniform7_sampler, vec2<f32>( Roughness, clamp( nodeVar73, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar74;
	nodeVar75 = ( dfg.x + dfg.y );
	nodeVar76 = ( 1.0 / nodeVar75 );
	nodeVar77 = nodeVar76;
	nodeVar78 = ( nodeVar77 - 1.0 );
	nodeVar79 = ( SpecularColorBlended * vec3<f32>( nodeVar78 ) );
	nodeVar80 = ( nodeVar79 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar80;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar81 = dot( normalWorld, normalize( render.nodeUniform12 ) );
	nodeVar82 = ( nodeVar81 * 0.5 );
	nodeVar83 = ( nodeVar82 + 0.5 );
	nodeVar84 = mix( render.nodeUniform9, render.nodeUniform10, nodeVar83 );
	nodeVar85 = ( irradiance + nodeVar84 );
	irradiance = nodeVar85;
	nodeVar86 = ( render.nodeUniform13 - render.nodeUniform14 );
	nodeVar87 = vec4<f32>( nodeVar86, 0.0 );
	nodeVar88 = ( render.cameraViewMatrix * nodeVar87 );
	nodeVar89 = normalize( nodeVar88.xyz );
	nodeVar90 = nodeVar89;
	nodeVar91 = dot( normalView, nodeVar90 );
	nodeVar92 = ( vec3<f32>( clamp( nodeVar91, 0.0, 1.0 ) ) * render.nodeUniform15 );
	nodeVar93 = nodeVar92;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar94 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar95 = ( nodeVar93 * nodeVar94 );
	nodeVar96 = ( nodeVar90 + positionViewDirection );
	nodeVar97 = normalize( nodeVar96 );
	nodeVar98 = dot( positionViewDirection, nodeVar97 );
	nodeVar99 = clamp( nodeVar98, 0.0, 1.0 );
	nodeVar100 = exp2( ( ( ( nodeVar99 * -5.55473 ) - 6.98316 ) * nodeVar99 ) );
	nodeVar101 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar100 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar100 ) ) );
	nodeVar102 = ( vec3<f32>( 1.0 ) - nodeVar101 );
	nodeVar103 = nodeVar102;
	nodeVar104 = ( nodeVar95 * nodeVar103 );
	nodeVar105 = ( directDiffuse + nodeVar104 );
	directDiffuse = nodeVar105;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar106 = normalize( ( nodeVar90 + positionViewDirection ) );
	nodeVar107 = clamp( dot( positionViewDirection, nodeVar106 ), 0.0, 1.0 );
	nodeVar108 = exp2( ( ( ( nodeVar107 * -5.55473 ) - 6.98316 ) * nodeVar107 ) );
	nodeVar109 = ( Roughness * Roughness );
	nodeVar110 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar108 ) ) ) + vec3<f32>( ( 1.0 * nodeVar108 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar109, clamp( dot( normalView, nodeVar90 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar109, clamp( dot( normalView, nodeVar106 ), 0.0, 1.0 ) ) ) );
	nodeVar111 = ( nodeVar93 * nodeVar110 );
	nodeVar112 = ( nodeVar111 * multiScatteringCompensation );
	nodeVar113 = ( directSpecular + nodeVar112 );
	directSpecular = nodeVar113;
	nodeVar114 = ( render.nodeUniform16 - render.nodeUniform17 );
	nodeVar115 = vec4<f32>( nodeVar114, 0.0 );
	nodeVar116 = ( render.cameraViewMatrix * nodeVar115 );
	nodeVar117 = normalize( nodeVar116.xyz );
	nodeVar118 = nodeVar117;
	nodeVar119 = dot( normalView, nodeVar118 );
	shadowPositionWorld = v_positionWorld;
	nodeVar121 = ( render.nodeUniform19 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform20 ) ) ), 1.0 ) );
	nodeVar122 = ( nodeVar121.xyz / vec3<f32>( nodeVar121.w ) );
	nodeVar123 = vec3<f32>( nodeVar122.x, ( 1.0 - nodeVar122.y ), ( nodeVar122.z + render.nodeUniform21 ) );

	if ( ( ( ( ( ( nodeVar123.x >= 0.0 ) && ( nodeVar123.x <= 1.0 ) ) && ( nodeVar123.y >= 0.0 ) ) && ( nodeVar123.y <= 1.0 ) ) && ( nodeVar123.z <= 1.0 ) ) ) {

		nodeVar124 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar125 = ( render.nodeUniform23 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform24 ).x );
		nodeVar126 = ( nodeVar123.xy + ( vogelDiskSample( 0, 5, nodeVar124 ) * vec2<f32>( nodeVar125 ) ) );
		nodeVar127 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar126, nodeVar123.z );
		nodeVar128 = ( nodeVar123.xy + ( vogelDiskSample( 1, 5, nodeVar124 ) * vec2<f32>( nodeVar125 ) ) );
		nodeVar129 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar128, nodeVar123.z );
		nodeVar130 = ( nodeVar123.xy + ( vogelDiskSample( 2, 5, nodeVar124 ) * vec2<f32>( nodeVar125 ) ) );
		nodeVar131 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar130, nodeVar123.z );
		nodeVar132 = ( nodeVar123.xy + ( vogelDiskSample( 3, 5, nodeVar124 ) * vec2<f32>( nodeVar125 ) ) );
		nodeVar133 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar132, nodeVar123.z );
		nodeVar134 = ( nodeVar123.xy + ( vogelDiskSample( 4, 5, nodeVar124 ) * vec2<f32>( nodeVar125 ) ) );
		nodeVar135 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar134, nodeVar123.z );
		nodeVar120 = ( ( ( ( ( nodeVar127 + nodeVar129 ) + nodeVar131 ) + nodeVar133 ) + nodeVar135 ) * 0.2 );

	} else {

		nodeVar120 = 1.0;

	}

	nodeVar136 = mix( 1.0, nodeVar120, render.nodeUniform25 );
	nodeVar137 = ( vec3<f32>( clamp( nodeVar119, 0.0, 1.0 ) ) * ( render.nodeUniform18 * vec3<f32>( nodeVar136 ) ) );
	nodeVar138 = nodeVar137;
	nodeVar139 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar140 = ( nodeVar138 * nodeVar139 );
	nodeVar141 = ( nodeVar118 + positionViewDirection );
	nodeVar142 = normalize( nodeVar141 );
	nodeVar143 = dot( positionViewDirection, nodeVar142 );
	nodeVar144 = clamp( nodeVar143, 0.0, 1.0 );
	nodeVar145 = exp2( ( ( ( nodeVar144 * -5.55473 ) - 6.98316 ) * nodeVar144 ) );
	nodeVar146 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar145 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar145 ) ) );
	nodeVar147 = ( vec3<f32>( 1.0 ) - nodeVar146 );
	nodeVar148 = nodeVar147;
	nodeVar149 = ( nodeVar140 * nodeVar148 );
	nodeVar150 = ( directDiffuse + nodeVar149 );
	directDiffuse = nodeVar150;
	nodeVar151 = normalize( ( nodeVar118 + positionViewDirection ) );
	nodeVar152 = clamp( dot( positionViewDirection, nodeVar151 ), 0.0, 1.0 );
	nodeVar153 = exp2( ( ( ( nodeVar152 * -5.55473 ) - 6.98316 ) * nodeVar152 ) );
	nodeVar154 = ( Roughness * Roughness );
	nodeVar155 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar153 ) ) ) + vec3<f32>( ( 1.0 * nodeVar153 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar154, clamp( dot( normalView, nodeVar118 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar154, clamp( dot( normalView, nodeVar151 ), 0.0, 1.0 ) ) ) );
	nodeVar156 = ( nodeVar138 * nodeVar155 );
	nodeVar157 = ( nodeVar156 * multiScatteringCompensation );
	nodeVar158 = ( directSpecular + nodeVar157 );
	directSpecular = nodeVar158;
	nodeVar159 = ( render.nodeUniform26 - v_positionView );
	nodeVar160 = normalize( nodeVar159 );
	nodeVar161 = dot( normalView, nodeVar160 );

	if ( ( render.nodeUniform28 > 0.0 ) ) {

		nodeVar163 = length( nodeVar159 );
		nodeVar164 = ( nodeVar163 / render.nodeUniform28 );
		nodeVar165 = clamp( ( 1.0 - ( ( ( nodeVar164 * nodeVar164 ) * nodeVar164 ) * nodeVar164 ) ), 0.0, 1.0 );
		nodeVar162 = ( ( 1.0 / max( pow( nodeVar163, render.nodeUniform29 ), 0.01 ) ) * ( nodeVar165 * nodeVar165 ) );

	} else {

		nodeVar162 = ( 1.0 / max( pow( length( nodeVar159 ), render.nodeUniform29 ), 0.01 ) );

	}

	nodeVar166 = ( render.nodeUniform27 * vec3<f32>( nodeVar162 ) );
	nodeVar167 = ( vec3<f32>( clamp( nodeVar161, 0.0, 1.0 ) ) * nodeVar166 );
	nodeVar168 = nodeVar167;
	nodeVar169 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar170 = ( nodeVar168 * nodeVar169 );
	nodeVar171 = ( nodeVar160 + positionViewDirection );
	nodeVar172 = normalize( nodeVar171 );
	nodeVar173 = dot( positionViewDirection, nodeVar172 );
	nodeVar174 = clamp( nodeVar173, 0.0, 1.0 );
	nodeVar175 = exp2( ( ( ( nodeVar174 * -5.55473 ) - 6.98316 ) * nodeVar174 ) );
	nodeVar176 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar175 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar175 ) ) );
	nodeVar177 = ( vec3<f32>( 1.0 ) - nodeVar176 );
	nodeVar178 = nodeVar177;
	nodeVar179 = ( nodeVar170 * nodeVar178 );
	nodeVar180 = ( directDiffuse + nodeVar179 );
	directDiffuse = nodeVar180;
	nodeVar181 = normalize( ( nodeVar160 + positionViewDirection ) );
	nodeVar182 = clamp( dot( positionViewDirection, nodeVar181 ), 0.0, 1.0 );
	nodeVar183 = exp2( ( ( ( nodeVar182 * -5.55473 ) - 6.98316 ) * nodeVar182 ) );
	nodeVar184 = ( Roughness * Roughness );
	nodeVar185 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar183 ) ) ) + vec3<f32>( ( 1.0 * nodeVar183 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar184, clamp( dot( normalView, nodeVar160 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar184, clamp( dot( normalView, nodeVar181 ), 0.0, 1.0 ) ) ) );
	nodeVar186 = ( nodeVar168 * nodeVar185 );
	nodeVar187 = ( nodeVar186 * multiScatteringCompensation );
	nodeVar188 = ( directSpecular + nodeVar187 );
	directSpecular = nodeVar188;
	nodeVar189 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar190 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar191 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar192 = ( SpecularF90 * dfg.y );
	nodeVar193 = ( nodeVar191 + vec3<f32>( nodeVar192 ) );
	nodeVar194 = ( nodeVar189 + nodeVar193 );
	nodeVar189 = nodeVar194;
	nodeVar195 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar196 = nodeVar195;
	nodeVar197 = ( nodeVar196 * vec3<f32>( 0.047619 ) );
	nodeVar198 = ( SpecularColor + nodeVar197 );
	nodeVar199 = ( nodeVar193 * nodeVar198 );
	nodeVar200 = ( dfg.x + dfg.y );
	nodeVar201 = ( 1.0 - nodeVar200 );
	nodeVar202 = nodeVar201;
	nodeVar203 = ( vec3<f32>( nodeVar202 ) * nodeVar198 );
	nodeVar204 = ( vec3<f32>( 1.0 ) - nodeVar203 );
	nodeVar205 = nodeVar204;
	nodeVar206 = ( nodeVar199 / nodeVar205 );
	nodeVar207 = ( nodeVar206 * vec3<f32>( nodeVar202 ) );
	nodeVar208 = ( nodeVar190 + nodeVar207 );
	nodeVar190 = nodeVar208;
	nodeVar209 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar210 = ( irradiance * nodeVar209 );
	nodeVar211 = ( nodeVar189 + nodeVar190 );
	nodeVar212 = ( vec3<f32>( 1.0 ) - nodeVar211 );
	nodeVar213 = nodeVar212;
	nodeVar214 = ( nodeVar210 * nodeVar213 );
	nodeVar215 = nodeVar214;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar216 = ( indirectDiffuse + nodeVar215 );
	indirectDiffuse = nodeVar216;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar217 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar218 = ( SpecularF90 * dfg.y );
	nodeVar219 = ( nodeVar217 + vec3<f32>( nodeVar218 ) );
	nodeVar220 = ( singleScatteringDielectric + nodeVar219 );
	singleScatteringDielectric = nodeVar220;
	nodeVar221 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar222 = nodeVar221;
	nodeVar223 = ( nodeVar222 * vec3<f32>( 0.047619 ) );
	nodeVar224 = ( SpecularColor + nodeVar223 );
	nodeVar225 = ( nodeVar219 * nodeVar224 );
	nodeVar226 = ( dfg.x + dfg.y );
	nodeVar227 = ( 1.0 - nodeVar226 );
	nodeVar228 = nodeVar227;
	nodeVar229 = ( vec3<f32>( nodeVar228 ) * nodeVar224 );
	nodeVar230 = ( vec3<f32>( 1.0 ) - nodeVar229 );
	nodeVar231 = nodeVar230;
	nodeVar232 = ( nodeVar225 / nodeVar231 );
	nodeVar233 = ( nodeVar232 * vec3<f32>( nodeVar228 ) );
	nodeVar234 = ( multiScatteringDielectric + nodeVar233 );
	multiScatteringDielectric = nodeVar234;
	nodeVar235 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar236 = ( SpecularF90 * dfg.y );
	nodeVar237 = ( nodeVar235 + vec3<f32>( nodeVar236 ) );
	nodeVar238 = ( singleScatteringMetallic + nodeVar237 );
	singleScatteringMetallic = nodeVar238;
	nodeVar239 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar240 = nodeVar239;
	nodeVar241 = ( nodeVar240 * vec3<f32>( 0.047619 ) );
	nodeVar242 = ( DiffuseColor.xyz + nodeVar241 );
	nodeVar243 = ( nodeVar237 * nodeVar242 );
	nodeVar244 = ( dfg.x + dfg.y );
	nodeVar245 = ( 1.0 - nodeVar244 );
	nodeVar246 = nodeVar245;
	nodeVar247 = ( vec3<f32>( nodeVar246 ) * nodeVar242 );
	nodeVar248 = ( vec3<f32>( 1.0 ) - nodeVar247 );
	nodeVar249 = nodeVar248;
	nodeVar250 = ( nodeVar243 / nodeVar249 );
	nodeVar251 = ( nodeVar250 * vec3<f32>( nodeVar246 ) );
	nodeVar252 = ( multiScatteringMetallic + nodeVar251 );
	multiScatteringMetallic = nodeVar252;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar253 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar254 = ( radiance * nodeVar253 );
	nodeVar255 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar256 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar257 = ( nodeVar255 * nodeVar256 );
	nodeVar258 = ( nodeVar254 + nodeVar257 );
	nodeVar259 = nodeVar258;
	nodeVar260 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar261 = ( vec3<f32>( 1.0 ) - nodeVar260 );
	nodeVar262 = nodeVar261;
	nodeVar263 = ( DiffuseContribution * nodeVar262 );
	nodeVar264 = ( nodeVar263 * nodeVar256 );
	nodeVar265 = nodeVar264;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar266 = ( indirectSpecular + nodeVar259 );
	indirectSpecular = nodeVar266;
	nodeVar267 = ( indirectDiffuse + nodeVar265 );
	indirectDiffuse = nodeVar267;
	ambientOcclusion = 1.0;
	nodeVar268 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar268;
	nodeVar269 = dot( normalView, positionViewDirection );
	nodeVar270 = ( clamp( nodeVar269, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar271 = ( Roughness * -16.0 );
	nodeVar272 = ( 1.0 - nodeVar271 );
	nodeVar273 = nodeVar272;
	nodeVar274 = ( - nodeVar273 );
	nodeVar275 = exp2( nodeVar274 );
	nodeVar276 = pow( nodeVar270, nodeVar275 );
	nodeVar277 = ( 1.0 - nodeVar276 );
	nodeVar278 = nodeVar277;
	nodeVar279 = ( ambientOcclusion - nodeVar278 );
	nodeVar280 = ( indirectSpecular * vec3<f32>( clamp( nodeVar279, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar280;
	nodeVar281 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar281;
	nodeVar282 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar282;
	nodeVar283 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar283;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar284 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar285 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform30, object.nodeUniform31, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform33 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform34 * object.nodeUniform34 ) * nodeVar284 ) * nodeVar284 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar285;

	// result

	output.color = nodeVar285;

	return output;

}
