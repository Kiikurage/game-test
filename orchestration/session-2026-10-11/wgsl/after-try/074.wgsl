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
@binding( 1 ) @group( 1 ) var nodeUniform0 : texture_3d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform8_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform8 : texture_2d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform21_sampler : sampler_comparison;
@binding( 6 ) @group( 1 ) var nodeUniform21 : texture_depth_2d;

struct objectStruct {
	nodeUniform1 : mat4x4<f32>,
	nodeUniform2 : f32,
	nodeUniform3 : f32,
	nodeUniform5 : mat3x3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform32 : vec3<f32>,
	nodeUniform33 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	nodeUniform7 : f32,
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform10 : vec3<f32>,
	nodeUniform11 : vec3<f32>,
	nodeUniform9 : vec3<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform26 : vec3<f32>,
	nodeUniform27 : f32,
	nodeUniform28 : f32,
	nodeUniform12 : vec3<f32>,
	nodeUniform13 : vec3<f32>,
	nodeUniform15 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform25 : vec3<f32>,
	nodeUniform18 : mat4x4<f32>,
	nodeUniform19 : f32,
	nodeUniform20 : f32,
	nodeUniform24 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform22 : f32,
	nodeUniform23 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : f32;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : u32;
var<private> nodeVar3 : u32;
var<private> nodeVar4 : u32;
var<private> nodeVar5 : u32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : f32;
var<private> nodeVar8 : u32;
var<private> nodeVar9 : u32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : f32;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : f32;
var<private> nodeVar17 : u32;
var<private> nodeVar18 : u32;
var<private> nodeVar19 : u32;
var<private> nodeVar20 : u32;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : f32;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : vec3<f32>;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : f32;
var<private> nodeVar32 : u32;
var<private> nodeVar33 : u32;
var<private> nodeVar34 : u32;
var<private> nodeVar35 : u32;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : f32;
var<private> nodeVar40 : vec3<f32>;
var<private> nodeVar41 : vec3<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar42 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar43 : vec3<f32>;
var<private> nodeVar44 : f32;
var<private> nodeVar45 : vec3<f32>;
var<private> nodeVar46 : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> NORMAL_nodeVar47 : vec3<f32>;
var<private> NORMAL_nodeVar48 : f32;
var<private> nodeVar49 : f32;
var<private> nodeVar50 : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : f32;
var<private> nodeVar53 : vec3<f32>;
var<private> nodeVar54 : f32;
var<private> nodeVar55 : vec3<f32>;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : vec3<f32>;
var<private> nodeVar58 : f32;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : f32;
var<private> nodeVar61 : vec3<f32>;
var<private> nodeVar62 : f32;
var<private> nodeVar63 : vec3<f32>;
var<private> nodeVar64 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar65 : f32;
var<private> nodeVar66 : vec2<f32>;
var<private> nodeVar67 : f32;
var<private> nodeVar68 : f32;
var<private> nodeVar69 : f32;
var<private> nodeVar70 : f32;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar73 : f32;
var<private> nodeVar74 : f32;
var<private> nodeVar75 : f32;
var<private> nodeVar76 : vec3<f32>;
var<private> nodeVar77 : vec3<f32>;
var<private> nodeVar78 : vec3<f32>;
var<private> nodeVar79 : vec4<f32>;
var<private> nodeVar80 : vec4<f32>;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : f32;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : f32;
var<private> nodeVar91 : f32;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : vec3<f32>;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar98 : vec3<f32>;
var<private> nodeVar99 : f32;
var<private> nodeVar100 : f32;
var<private> nodeVar101 : f32;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec4<f32>;
var<private> nodeVar108 : vec4<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar112 : f32;
var<private> nodeVar113 : vec4<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : f32;
var<private> nodeVar117 : f32;
var<private> nodeVar118 : vec2<f32>;
var<private> nodeVar119 : f32;
var<private> nodeVar120 : vec2<f32>;
var<private> nodeVar121 : f32;
var<private> nodeVar122 : vec2<f32>;
var<private> nodeVar123 : f32;
var<private> nodeVar124 : vec2<f32>;
var<private> nodeVar125 : f32;
var<private> nodeVar126 : vec2<f32>;
var<private> nodeVar127 : f32;
var<private> nodeVar128 : f32;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : f32;
var<private> nodeVar136 : f32;
var<private> nodeVar137 : f32;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : f32;
var<private> nodeVar145 : f32;
var<private> nodeVar146 : f32;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : f32;
var<private> nodeVar154 : f32;
var<private> nodeVar155 : f32;
var<private> nodeVar156 : f32;
var<private> nodeVar157 : f32;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : f32;
var<private> nodeVar166 : f32;
var<private> nodeVar167 : f32;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : f32;
var<private> nodeVar175 : f32;
var<private> nodeVar176 : f32;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : f32;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : f32;
var<private> nodeVar193 : f32;
var<private> nodeVar194 : f32;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : f32;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : f32;
var<private> nodeVar219 : f32;
var<private> nodeVar220 : f32;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : f32;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> nodeVar233 : vec3<f32>;
var<private> nodeVar234 : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> nodeVar236 : f32;
var<private> nodeVar237 : f32;
var<private> nodeVar238 : f32;
var<private> nodeVar239 : vec3<f32>;
var<private> nodeVar240 : vec3<f32>;
var<private> nodeVar241 : vec3<f32>;
var<private> nodeVar242 : vec3<f32>;
var<private> nodeVar243 : vec3<f32>;
var<private> nodeVar244 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar245 : vec3<f32>;
var<private> nodeVar246 : vec3<f32>;
var<private> nodeVar247 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar248 : vec3<f32>;
var<private> nodeVar249 : vec3<f32>;
var<private> nodeVar250 : vec3<f32>;
var<private> nodeVar251 : vec3<f32>;
var<private> nodeVar252 : vec3<f32>;
var<private> nodeVar253 : vec3<f32>;
var<private> nodeVar254 : vec3<f32>;
var<private> nodeVar255 : vec3<f32>;
var<private> nodeVar256 : vec3<f32>;
var<private> nodeVar257 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar258 : vec3<f32>;
var<private> nodeVar259 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar260 : vec3<f32>;
var<private> nodeVar261 : f32;
var<private> nodeVar262 : f32;
var<private> nodeVar263 : f32;
var<private> nodeVar264 : f32;
var<private> nodeVar265 : f32;
var<private> nodeVar266 : f32;
var<private> nodeVar267 : f32;
var<private> nodeVar268 : f32;
var<private> nodeVar269 : f32;
var<private> nodeVar270 : f32;
var<private> nodeVar271 : f32;
var<private> nodeVar272 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar273 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar274 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar275 : vec3<f32>;
var<private> nodeVar276 : f32;
var<private> nodeVar277 : vec4<f32>;

// codes
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
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) v_normalViewGeometry : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@location( 4 ) nodeVarying7 : f32,
	@location( 5 ) nodeVarying8 : f32,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = ( nodeVarying7 / 0.84 );
	nodeVar1 = floor( nodeVar0 );
	nodeVar2 = ( ( u32( ( ( nodeVar1 * 1.9 ) + 13.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar3 = ( ( ( nodeVar2 >> ( ( nodeVar2 >> 28u ) + 4u ) ) ^ nodeVar2 ) * 277803737u );
	nodeVar4 = ( ( u32( ( nodeVar1 + 5.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar5 = ( ( ( nodeVar4 >> ( ( nodeVar4 >> 28u ) + 4u ) ) ^ nodeVar4 ) * 277803737u );
	nodeVar6 = ( 1000.0 * ( ( ( f32( ( ( nodeVar5 >> 22u ) ^ nodeVar5 ) ) * 2.3283064365386963e-10 ) * 0.5 ) + 0.78 ) );
	nodeVar7 = ( ( nodeVarying8 + ( ( f32( ( ( nodeVar3 >> 22u ) ^ nodeVar3 ) ) * 2.3283064365386963e-10 ) * nodeVar6 ) ) / nodeVar6 );
	nodeVar8 = ( ( u32( ( ( nodeVar1 * 91.7 ) + floor( nodeVar7 ) ) ) * 747796405u ) + 2891336453u );
	nodeVar9 = ( ( ( nodeVar8 >> ( ( nodeVar8 >> 28u ) + 4u ) ) ^ nodeVar8 ) * 277803737u );
	nodeVar10 = ( f32( ( ( nodeVar9 >> 22u ) ^ nodeVar9 ) ) * 2.3283064365386963e-10 );
	nodeVar11 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( v_positionWorld * vec3<f32>( 2.4 ) ) + vec3<f32>( nodeVar10 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar12 = ( v_positionWorld.y - 9.9 );
	nodeVar13 = textureSample( nodeUniform0, nodeUniform0_sampler, ( vec3<f32>( ( nodeVarying8 * 2.1 ), ( nodeVarying7 * 0.25 ), 3.3 ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar14 = ( max( ( ( 1.0 - smoothstep( 0.1, 1.5, nodeVar12 ) ) * 0.95 ), ( ( ( nodeVar13 * 0.5 ) + 0.5 ) * 0.38 ) ) * 1.0 );
	nodeVar15 = ( smoothstep( 0.0, 0.5, ( ( nodeVar11 + ( nodeVar14 * 0.9 ) ) - 0.15 ) ) * nodeVar14 );
	nodeVar16 = mix( 0.62, 1.0, smoothstep( 0.0, 0.7, nodeVar12 ) );
	nodeVar17 = ( ( u32( ( nodeVar10 + 17.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar18 = ( ( ( nodeVar17 >> ( ( nodeVar17 >> 28u ) + 4u ) ) ^ nodeVar17 ) * 277803737u );
	nodeVar19 = ( ( u32( nodeVar10 ) * 747796405u ) + 2891336453u );
	nodeVar20 = ( ( ( nodeVar19 >> ( ( nodeVar19 >> 28u ) + 4u ) ) ^ nodeVar19 ) * 277803737u );
	nodeVar21 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( v_positionWorld * vec3<f32>( 0.85 ) ) + vec3<f32>( ( nodeVar10 * 1.7 ) ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar22 = ( ( nodeVar21 * 0.5 ) + 0.5 );
	nodeVar23 = fract( nodeVar0 );
	nodeVar24 = fract( nodeVar7 );
	nodeVar25 = min( ( min( nodeVar23, ( 1.0 - nodeVar23 ) ) * 0.84 ), ( min( nodeVar24, ( 1.0 - nodeVar24 ) ) * nodeVar6 ) );
	nodeVar26 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( v_positionWorld * vec3<f32>( 9.5 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar27 = ( ( nodeVar25 + ( nodeVar26 * 0.014 ) ) + 0.0 );
	nodeVar28 = ( ( v_positionWorld * vec3<f32>( 2.6 ) ) + vec3<f32>( ( nodeVar10 * 3.1 ) ) );
	nodeVar29 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( nodeVar28 * vec3<f32>( 2.9 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar30 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( nodeVar28 + vec3<f32>( ( nodeVar29 * 0.4 ) ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar31 = abs( nodeVar30 );
	nodeVar32 = ( ( u32( ( nodeVar10 + 3.7 ) ) * 747796405u ) + 2891336453u );
	nodeVar33 = ( ( ( nodeVar32 >> ( ( nodeVar32 >> 28u ) + 4u ) ) ^ nodeVar32 ) * 277803737u );
	nodeVar34 = ( ( u32( ( nodeVar10 + 9.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar35 = ( ( ( nodeVar34 >> ( ( nodeVar34 >> 28u ) + 4u ) ) ^ nodeVar34 ) * 277803737u );
	nodeVar36 = ( 0.022 + ( ( f32( ( ( nodeVar35 >> 22u ) ^ nodeVar35 ) ) * 2.3283064365386963e-10 ) * 0.012 ) );
	nodeVar37 = ( fwidth( nodeVar25 ) + 0.0015 );
	nodeVar38 = smoothstep( ( nodeVar36 - ( nodeVar37 * 0.9 ) ), ( nodeVar36 + ( nodeVar37 * 0.9 ) ), nodeVar27 );
	nodeVar39 = max( ( ( ( 1.0 - smoothstep( 0.016, ( ( ( fwidth( nodeVar31 ) + 0.002 ) * 1.6 ) + 0.016 ), nodeVar31 ) ) * step( 0.615, ( f32( ( ( nodeVar33 >> 22u ) ^ nodeVar33 ) ) * 2.3283064365386963e-10 ) ) ) * nodeVar38 ), ( ( ( ( 1.0 - smoothstep( 0.012, ( 0.012 + ( ( fwidth( 1.0 ) + 0.0015 ) * 1.6 ) ), 1.0 ) ) * 0.0 ) * 0.0 ) * nodeVar38 ) );
	nodeVar40 = ( ( ( ( ( ( ( ( vec3<f32>( 0.215, 0.205, 0.192 ) * mix( vec3<f32>( 0.83, 0.92, 1.05 ), vec3<f32>( 1.07, 0.97, 0.8 ), ( f32( ( ( nodeVar18 >> 22u ) ^ nodeVar18 ) ) * 2.3283064365386963e-10 ) ) ) * vec3<f32>( ( 0.5 + ( ( f32( ( ( nodeVar20 >> 22u ) ^ nodeVar20 ) ) * 2.3283064365386963e-10 ) * 0.85 ) ) ) ) * vec3<f32>( mix( 0.74, 1.14, nodeVar22 ) ) ) * vec3<f32>( ( 1.0 + ( 0.0 * 0.15 ) ) ) ) * vec3<f32>( ( 1.0 - ( 0.0 * 0.3 ) ) ) ) * vec3<f32>( mix( 0.68, 1.0, smoothstep( 0.0, 0.17, nodeVar27 ) ) ) ) * vec3<f32>( ( 1.0 + ( ( smoothstep( 0.02, 0.05, nodeVar27 ) * ( 1.0 - smoothstep( 0.05, 0.11, nodeVar27 ) ) ) * 0.14 ) ) ) ) * vec3<f32>( ( 1.0 - ( nodeVar39 * 0.78 ) ) ) );
	nodeVar41 = mix( ( mix( vec3<f32>( 0.045, 0.041, 0.038 ), vec3<f32>( 0.07, 0.092, 0.04 ), ( nodeVar15 * 0.9 ) ) * vec3<f32>( nodeVar16 ) ), ( ( mix( nodeVar40, ( nodeVar40 * vec3<f32>( 0.62, 0.78, 0.5 ) ), ( nodeVar15 * 0.7 ) ) * vec3<f32>( ( 1.0 - ( nodeVar14 * 0.38 ) ) ) ) * vec3<f32>( nodeVar16 ) ), nodeVar38 );
	DiffuseColor = vec4<f32>( nodeVar41, 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform2 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform3;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar42 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( mix( 1.0, ( ( 0.93 - ( nodeVar22 * 0.1 ) ) + ( nodeVar15 * 0.07 ) ), nodeVar38 ), 0.0525 ) + max( max( nodeVar42.x, nodeVar42.y ), nodeVar42.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform3 ) ) );
	nodeVar43 = ( vec3<f32>( 115.88471875080587, 12.15, 71.23640507046963 ) - v_positionWorld );
	nodeVar44 = ( length( nodeVar43 ) / 4.4 );
	nodeVar45 = dpdx( v_positionView );
	nodeVar46 = - dpdy( v_positionView );
	NORMAL_normalView = normalViewGeometry;
	NORMAL_nodeVar47 = cross( nodeVar46, NORMAL_normalView );
	NORMAL_nodeVar48 = dot( nodeVar45, NORMAL_nodeVar47 );
	nodeVar49 = ( ( ( ( ( nodeVar38 * 0.014 ) - ( 0.0 * 0.004 ) ) - ( nodeVar39 * 0.006 ) ) + ( 0.0 * 0.0018 ) ) + ( ( ( nodeVar22 - 0.5 ) * 2.0 ) * 0.004 ) );
	nodeVar50 = ( vec3<f32>( sign( NORMAL_nodeVar48 ) ) * ( ( ( vec3<f32>( dpdx( nodeVar49 ) ) * NORMAL_nodeVar47 ) + ( vec3<f32>( - dpdy( nodeVar49 ) ) * cross( NORMAL_normalView, nodeVar45 ) ) ) * vec3<f32>( 1.0 ) ) );
	normalView = normalize( ( ( vec3<f32>( abs( NORMAL_nodeVar48 ) ) * NORMAL_normalView ) - nodeVar50 ) );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar51 = ( vec3<f32>( 128.11528124919414, 12.15, 71.23640507046964 ) - v_positionWorld );
	nodeVar52 = ( length( nodeVar51 ) / 4.4 );
	nodeVar53 = ( vec3<f32>( 136.76359492953037, 12.15, 79.88471875080587 ) - v_positionWorld );
	nodeVar54 = ( length( nodeVar53 ) / 4.4 );
	nodeVar55 = ( vec3<f32>( 136.76359492953037, 12.15, 92.11528124919414 ) - v_positionWorld );
	nodeVar56 = ( length( nodeVar55 ) / 4.4 );
	nodeVar57 = ( vec3<f32>( 128.11528124919414, 12.15, 100.76359492953037 ) - v_positionWorld );
	nodeVar58 = ( length( nodeVar57 ) / 4.4 );
	nodeVar59 = ( vec3<f32>( 115.88471875080586, 12.15, 100.76359492953037 ) - v_positionWorld );
	nodeVar60 = ( length( nodeVar59 ) / 4.4 );
	nodeVar61 = ( vec3<f32>( 107.23640507046963, 12.15, 92.11528124919413 ) - v_positionWorld );
	nodeVar62 = ( length( nodeVar61 ) / 4.4 );
	nodeVar63 = ( vec3<f32>( 107.23640507046963, 12.15, 79.88471875080586 ) - v_positionWorld );
	nodeVar64 = ( length( nodeVar63 ) / 4.4 );
	EmissiveColor = ( nodeVar41 * ( ( vec3<f32>( 1.0, 0.52, 0.2 ) * ( ( ( ( ( ( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar44 * nodeVar44 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar43 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 0.0 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 0.0 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 0.0 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar52 * nodeVar52 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar51 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 2.399 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 4.0783 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 7.4369000000000005 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar54 * nodeVar54 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar53 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 4.798 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 8.1566 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 14.873800000000001 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar56 * nodeVar56 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar55 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 7.197 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 12.2349 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 22.3107 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar58 * nodeVar58 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar57 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 9.596 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 16.3132 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 29.747600000000002 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar60 * nodeVar60 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar59 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 11.995000000000001 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 20.3915 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 37.18450000000001 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar62 * nodeVar62 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar61 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 14.394 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 24.4698 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 44.6214 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar64 * nodeVar64 ) ), 2.0 ) ) * ( ( max( dot( normalWorld, normalize( nodeVar63 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform7 * 9.3 ) + 16.793 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform7 * 17.1 ) + 28.548099999999998 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform7 * 29.0 ) + 52.0583 ) ) * 0.03 ) ) ) ) ) ) * vec3<f32>( 2.1 ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar65 = dot( normalView, positionViewDirection );
	nodeVar66 = textureSample( nodeUniform8, nodeUniform8_sampler, vec2<f32>( Roughness, clamp( nodeVar65, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar66;
	nodeVar67 = ( dfg.x + dfg.y );
	nodeVar68 = ( 1.0 / nodeVar67 );
	nodeVar69 = nodeVar68;
	nodeVar70 = ( nodeVar69 - 1.0 );
	nodeVar71 = ( SpecularColorBlended * vec3<f32>( nodeVar70 ) );
	nodeVar72 = ( nodeVar71 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar72;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar73 = dot( normalWorld, normalize( render.nodeUniform11 ) );
	nodeVar74 = ( nodeVar73 * 0.5 );
	nodeVar75 = ( nodeVar74 + 0.5 );
	nodeVar76 = mix( render.nodeUniform9, render.nodeUniform10, nodeVar75 );
	nodeVar77 = ( irradiance + nodeVar76 );
	irradiance = nodeVar77;
	nodeVar78 = ( render.nodeUniform12 - render.nodeUniform13 );
	nodeVar79 = vec4<f32>( nodeVar78, 0.0 );
	nodeVar80 = ( render.cameraViewMatrix * nodeVar79 );
	nodeVar81 = normalize( nodeVar80.xyz );
	nodeVar82 = nodeVar81;
	nodeVar83 = dot( normalView, nodeVar82 );
	nodeVar84 = ( vec3<f32>( clamp( nodeVar83, 0.0, 1.0 ) ) * render.nodeUniform14 );
	nodeVar85 = nodeVar84;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar86 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar87 = ( nodeVar85 * nodeVar86 );
	nodeVar88 = ( nodeVar82 + positionViewDirection );
	nodeVar89 = normalize( nodeVar88 );
	nodeVar90 = dot( positionViewDirection, nodeVar89 );
	nodeVar91 = clamp( nodeVar90, 0.0, 1.0 );
	nodeVar92 = exp2( ( ( ( nodeVar91 * -5.55473 ) - 6.98316 ) * nodeVar91 ) );
	nodeVar93 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar92 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar92 ) ) );
	nodeVar94 = ( vec3<f32>( 1.0 ) - nodeVar93 );
	nodeVar95 = nodeVar94;
	nodeVar96 = ( nodeVar87 * nodeVar95 );
	nodeVar97 = ( directDiffuse + nodeVar96 );
	directDiffuse = nodeVar97;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar98 = normalize( ( nodeVar82 + positionViewDirection ) );
	nodeVar99 = clamp( dot( positionViewDirection, nodeVar98 ), 0.0, 1.0 );
	nodeVar100 = exp2( ( ( ( nodeVar99 * -5.55473 ) - 6.98316 ) * nodeVar99 ) );
	nodeVar101 = ( Roughness * Roughness );
	nodeVar102 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar100 ) ) ) + vec3<f32>( ( 1.0 * nodeVar100 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar101, clamp( dot( normalView, nodeVar82 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar101, clamp( dot( normalView, nodeVar98 ), 0.0, 1.0 ) ) ) );
	nodeVar103 = ( nodeVar85 * nodeVar102 );
	nodeVar104 = ( nodeVar103 * multiScatteringCompensation );
	nodeVar105 = ( directSpecular + nodeVar104 );
	directSpecular = nodeVar105;
	nodeVar106 = ( render.nodeUniform15 - render.nodeUniform16 );
	nodeVar107 = vec4<f32>( nodeVar106, 0.0 );
	nodeVar108 = ( render.cameraViewMatrix * nodeVar107 );
	nodeVar109 = normalize( nodeVar108.xyz );
	nodeVar110 = nodeVar109;
	nodeVar111 = dot( normalView, nodeVar110 );
	shadowPositionWorld = v_positionWorld;
	nodeVar113 = ( render.nodeUniform18 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform19 ) ) ), 1.0 ) );
	nodeVar114 = ( nodeVar113.xyz / vec3<f32>( nodeVar113.w ) );
	nodeVar115 = vec3<f32>( nodeVar114.x, ( 1.0 - nodeVar114.y ), ( nodeVar114.z + render.nodeUniform20 ) );

	if ( ( ( ( ( ( nodeVar115.x >= 0.0 ) && ( nodeVar115.x <= 1.0 ) ) && ( nodeVar115.y >= 0.0 ) ) && ( nodeVar115.y <= 1.0 ) ) && ( nodeVar115.z <= 1.0 ) ) ) {

		nodeVar116 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar117 = ( render.nodeUniform22 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform23 ).x );
		nodeVar118 = ( nodeVar115.xy + ( vogelDiskSample( 0, 5, nodeVar116 ) * vec2<f32>( nodeVar117 ) ) );
		nodeVar119 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar118, nodeVar115.z );
		nodeVar120 = ( nodeVar115.xy + ( vogelDiskSample( 1, 5, nodeVar116 ) * vec2<f32>( nodeVar117 ) ) );
		nodeVar121 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar120, nodeVar115.z );
		nodeVar122 = ( nodeVar115.xy + ( vogelDiskSample( 2, 5, nodeVar116 ) * vec2<f32>( nodeVar117 ) ) );
		nodeVar123 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar122, nodeVar115.z );
		nodeVar124 = ( nodeVar115.xy + ( vogelDiskSample( 3, 5, nodeVar116 ) * vec2<f32>( nodeVar117 ) ) );
		nodeVar125 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar124, nodeVar115.z );
		nodeVar126 = ( nodeVar115.xy + ( vogelDiskSample( 4, 5, nodeVar116 ) * vec2<f32>( nodeVar117 ) ) );
		nodeVar127 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar126, nodeVar115.z );
		nodeVar112 = ( ( ( ( ( nodeVar119 + nodeVar121 ) + nodeVar123 ) + nodeVar125 ) + nodeVar127 ) * 0.2 );

	} else {

		nodeVar112 = 1.0;

	}

	nodeVar128 = mix( 1.0, nodeVar112, render.nodeUniform24 );
	nodeVar129 = ( vec3<f32>( clamp( nodeVar111, 0.0, 1.0 ) ) * ( render.nodeUniform17 * vec3<f32>( nodeVar128 ) ) );
	nodeVar130 = nodeVar129;
	nodeVar131 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar132 = ( nodeVar130 * nodeVar131 );
	nodeVar133 = ( nodeVar110 + positionViewDirection );
	nodeVar134 = normalize( nodeVar133 );
	nodeVar135 = dot( positionViewDirection, nodeVar134 );
	nodeVar136 = clamp( nodeVar135, 0.0, 1.0 );
	nodeVar137 = exp2( ( ( ( nodeVar136 * -5.55473 ) - 6.98316 ) * nodeVar136 ) );
	nodeVar138 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar137 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar137 ) ) );
	nodeVar139 = ( vec3<f32>( 1.0 ) - nodeVar138 );
	nodeVar140 = nodeVar139;
	nodeVar141 = ( nodeVar132 * nodeVar140 );
	nodeVar142 = ( directDiffuse + nodeVar141 );
	directDiffuse = nodeVar142;
	nodeVar143 = normalize( ( nodeVar110 + positionViewDirection ) );
	nodeVar144 = clamp( dot( positionViewDirection, nodeVar143 ), 0.0, 1.0 );
	nodeVar145 = exp2( ( ( ( nodeVar144 * -5.55473 ) - 6.98316 ) * nodeVar144 ) );
	nodeVar146 = ( Roughness * Roughness );
	nodeVar147 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar145 ) ) ) + vec3<f32>( ( 1.0 * nodeVar145 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar146, clamp( dot( normalView, nodeVar110 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar146, clamp( dot( normalView, nodeVar143 ), 0.0, 1.0 ) ) ) );
	nodeVar148 = ( nodeVar130 * nodeVar147 );
	nodeVar149 = ( nodeVar148 * multiScatteringCompensation );
	nodeVar150 = ( directSpecular + nodeVar149 );
	directSpecular = nodeVar150;
	nodeVar151 = ( render.nodeUniform25 - v_positionView );
	nodeVar152 = normalize( nodeVar151 );
	nodeVar153 = dot( normalView, nodeVar152 );

	if ( ( render.nodeUniform27 > 0.0 ) ) {

		nodeVar155 = length( nodeVar151 );
		nodeVar156 = ( nodeVar155 / render.nodeUniform27 );
		nodeVar157 = clamp( ( 1.0 - ( ( ( nodeVar156 * nodeVar156 ) * nodeVar156 ) * nodeVar156 ) ), 0.0, 1.0 );
		nodeVar154 = ( ( 1.0 / max( pow( nodeVar155, render.nodeUniform28 ), 0.01 ) ) * ( nodeVar157 * nodeVar157 ) );

	} else {

		nodeVar154 = ( 1.0 / max( pow( length( nodeVar151 ), render.nodeUniform28 ), 0.01 ) );

	}

	nodeVar158 = ( render.nodeUniform26 * vec3<f32>( nodeVar154 ) );
	nodeVar159 = ( vec3<f32>( clamp( nodeVar153, 0.0, 1.0 ) ) * nodeVar158 );
	nodeVar160 = nodeVar159;
	nodeVar161 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar162 = ( nodeVar160 * nodeVar161 );
	nodeVar163 = ( nodeVar152 + positionViewDirection );
	nodeVar164 = normalize( nodeVar163 );
	nodeVar165 = dot( positionViewDirection, nodeVar164 );
	nodeVar166 = clamp( nodeVar165, 0.0, 1.0 );
	nodeVar167 = exp2( ( ( ( nodeVar166 * -5.55473 ) - 6.98316 ) * nodeVar166 ) );
	nodeVar168 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar167 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar167 ) ) );
	nodeVar169 = ( vec3<f32>( 1.0 ) - nodeVar168 );
	nodeVar170 = nodeVar169;
	nodeVar171 = ( nodeVar162 * nodeVar170 );
	nodeVar172 = ( directDiffuse + nodeVar171 );
	directDiffuse = nodeVar172;
	nodeVar173 = normalize( ( nodeVar152 + positionViewDirection ) );
	nodeVar174 = clamp( dot( positionViewDirection, nodeVar173 ), 0.0, 1.0 );
	nodeVar175 = exp2( ( ( ( nodeVar174 * -5.55473 ) - 6.98316 ) * nodeVar174 ) );
	nodeVar176 = ( Roughness * Roughness );
	nodeVar177 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar175 ) ) ) + vec3<f32>( ( 1.0 * nodeVar175 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar176, clamp( dot( normalView, nodeVar152 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar176, clamp( dot( normalView, nodeVar173 ), 0.0, 1.0 ) ) ) );
	nodeVar178 = ( nodeVar160 * nodeVar177 );
	nodeVar179 = ( nodeVar178 * multiScatteringCompensation );
	nodeVar180 = ( directSpecular + nodeVar179 );
	directSpecular = nodeVar180;
	nodeVar181 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar182 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar183 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar184 = ( SpecularF90 * dfg.y );
	nodeVar185 = ( nodeVar183 + vec3<f32>( nodeVar184 ) );
	nodeVar186 = ( nodeVar181 + nodeVar185 );
	nodeVar181 = nodeVar186;
	nodeVar187 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar188 = nodeVar187;
	nodeVar189 = ( nodeVar188 * vec3<f32>( 0.047619 ) );
	nodeVar190 = ( SpecularColor + nodeVar189 );
	nodeVar191 = ( nodeVar185 * nodeVar190 );
	nodeVar192 = ( dfg.x + dfg.y );
	nodeVar193 = ( 1.0 - nodeVar192 );
	nodeVar194 = nodeVar193;
	nodeVar195 = ( vec3<f32>( nodeVar194 ) * nodeVar190 );
	nodeVar196 = ( vec3<f32>( 1.0 ) - nodeVar195 );
	nodeVar197 = nodeVar196;
	nodeVar198 = ( nodeVar191 / nodeVar197 );
	nodeVar199 = ( nodeVar198 * vec3<f32>( nodeVar194 ) );
	nodeVar200 = ( nodeVar182 + nodeVar199 );
	nodeVar182 = nodeVar200;
	nodeVar201 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar202 = ( irradiance * nodeVar201 );
	nodeVar203 = ( nodeVar181 + nodeVar182 );
	nodeVar204 = ( vec3<f32>( 1.0 ) - nodeVar203 );
	nodeVar205 = nodeVar204;
	nodeVar206 = ( nodeVar202 * nodeVar205 );
	nodeVar207 = nodeVar206;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar208 = ( indirectDiffuse + nodeVar207 );
	indirectDiffuse = nodeVar208;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar209 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar210 = ( SpecularF90 * dfg.y );
	nodeVar211 = ( nodeVar209 + vec3<f32>( nodeVar210 ) );
	nodeVar212 = ( singleScatteringDielectric + nodeVar211 );
	singleScatteringDielectric = nodeVar212;
	nodeVar213 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar214 = nodeVar213;
	nodeVar215 = ( nodeVar214 * vec3<f32>( 0.047619 ) );
	nodeVar216 = ( SpecularColor + nodeVar215 );
	nodeVar217 = ( nodeVar211 * nodeVar216 );
	nodeVar218 = ( dfg.x + dfg.y );
	nodeVar219 = ( 1.0 - nodeVar218 );
	nodeVar220 = nodeVar219;
	nodeVar221 = ( vec3<f32>( nodeVar220 ) * nodeVar216 );
	nodeVar222 = ( vec3<f32>( 1.0 ) - nodeVar221 );
	nodeVar223 = nodeVar222;
	nodeVar224 = ( nodeVar217 / nodeVar223 );
	nodeVar225 = ( nodeVar224 * vec3<f32>( nodeVar220 ) );
	nodeVar226 = ( multiScatteringDielectric + nodeVar225 );
	multiScatteringDielectric = nodeVar226;
	nodeVar227 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar228 = ( SpecularF90 * dfg.y );
	nodeVar229 = ( nodeVar227 + vec3<f32>( nodeVar228 ) );
	nodeVar230 = ( singleScatteringMetallic + nodeVar229 );
	singleScatteringMetallic = nodeVar230;
	nodeVar231 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar232 = nodeVar231;
	nodeVar233 = ( nodeVar232 * vec3<f32>( 0.047619 ) );
	nodeVar234 = ( DiffuseColor.xyz + nodeVar233 );
	nodeVar235 = ( nodeVar229 * nodeVar234 );
	nodeVar236 = ( dfg.x + dfg.y );
	nodeVar237 = ( 1.0 - nodeVar236 );
	nodeVar238 = nodeVar237;
	nodeVar239 = ( vec3<f32>( nodeVar238 ) * nodeVar234 );
	nodeVar240 = ( vec3<f32>( 1.0 ) - nodeVar239 );
	nodeVar241 = nodeVar240;
	nodeVar242 = ( nodeVar235 / nodeVar241 );
	nodeVar243 = ( nodeVar242 * vec3<f32>( nodeVar238 ) );
	nodeVar244 = ( multiScatteringMetallic + nodeVar243 );
	multiScatteringMetallic = nodeVar244;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar245 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar246 = ( radiance * nodeVar245 );
	nodeVar247 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar248 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar249 = ( nodeVar247 * nodeVar248 );
	nodeVar250 = ( nodeVar246 + nodeVar249 );
	nodeVar251 = nodeVar250;
	nodeVar252 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar253 = ( vec3<f32>( 1.0 ) - nodeVar252 );
	nodeVar254 = nodeVar253;
	nodeVar255 = ( DiffuseContribution * nodeVar254 );
	nodeVar256 = ( nodeVar255 * nodeVar248 );
	nodeVar257 = nodeVar256;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar258 = ( indirectSpecular + nodeVar251 );
	indirectSpecular = nodeVar258;
	nodeVar259 = ( indirectDiffuse + nodeVar257 );
	indirectDiffuse = nodeVar259;
	ambientOcclusion = 1.0;
	nodeVar260 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar260;
	nodeVar261 = dot( normalView, positionViewDirection );
	nodeVar262 = ( clamp( nodeVar261, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar263 = ( Roughness * -16.0 );
	nodeVar264 = ( 1.0 - nodeVar263 );
	nodeVar265 = nodeVar264;
	nodeVar266 = ( - nodeVar265 );
	nodeVar267 = exp2( nodeVar266 );
	nodeVar268 = pow( nodeVar262, nodeVar267 );
	nodeVar269 = ( 1.0 - nodeVar268 );
	nodeVar270 = nodeVar269;
	nodeVar271 = ( ambientOcclusion - nodeVar270 );
	nodeVar272 = ( indirectSpecular * vec3<f32>( clamp( nodeVar271, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar272;
	nodeVar273 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar273;
	nodeVar274 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar274;
	nodeVar275 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar275;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar276 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar277 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform29, object.nodeUniform30, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform32 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform33 * object.nodeUniform33 ) * nodeVar276 ) * nodeVar276 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar277;

	// result

	output.color = nodeVar277;

	return output;

}
